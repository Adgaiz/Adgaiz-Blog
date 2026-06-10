---
title: "权益券模板时间字段写入 1970 问题技术复盘"
category: "Bug技术文档"
tags: ["Bug复盘", "后端", "Java"]
---

# 权益券模板时间字段写入 1970 问题技术复盘

## 1. 问题现象

在平台端编辑权益券模板发放时间时，页面提示保存成功，但再次打开页面发放时间为空；数据库中 `rscx_coupon_template.start_time` 或 `end_time` 被写入为 `1970-01-01 08:00:00`。

该异常会进一步影响会员权益重算/自动发券闭环：当模板 `end_time` 变成 1970 年后，当前时间已经晚于结束时间，系统判断模板不在发放期内，本次重算不会发放权益券。

## 2. 影响范围

- 影响所有通过全局 Jackson `LocalDateTime` 反序列化器接收入参的后端接口。
- RSCX 模块中最直接受影响的是权益券模板发放开始/结束时间。
- 由于后台前端大量日期控件使用 `value-format="YYYY-MM-DD HH:mm:ss"` 或空字符串提交，其他同类 `LocalDateTime` 入参也存在潜在风险。

## 3. 根因链路

```text
前端日期字段留空或发送 yyyy-MM-dd HH:mm:ss 字符串
        ↓
TimestampLocalDateTimeDeserializer 使用 p.getValueAsLong()
        ↓
空字符串、null、非数字日期字符串被 Jackson 兜底转换为 0L
        ↓
LocalDateTime.ofInstant(Instant.ofEpochMilli(0), ZoneId.systemDefault())
        ↓
服务端时区为 CST 时写入 1970-01-01 08:00:00
        ↓
权益券模板 endTime 不再为 null，跳过 null 保护
        ↓
isInTemplateTime 判断 now.isAfter(1970-01-01 08:00:00) 为 true
        ↓
模板不在发放期内，会员重算静默跳过发券
```

## 4. 修复方案

修复文件：

- `yudao-framework/yudao-common/src/main/java/cn/iocoder/yudao/framework/common/util/json/databind/TimestampLocalDateTimeDeserializer.java`
- `yudao-framework/yudao-common/src/test/java/cn/iocoder/yudao/framework/common/util/json/databind/TimestampLocalDateTimeDeserializerTest.java`

修复策略：

- `VALUE_NULL` 返回 `null`。
- 空字符串或全空白字符串返回 `null`。
- 数字类型和数字字符串 continue 按毫秒时间戳解析，保持历史兼容。
- `yyyy-MM-dd HH:mm:ss`、`yyyy-MM-dd HH:mm`、ISO LocalDateTime 字符串按明确格式解析。
- 非法日期字符串抛出 Jackson 映射异常，不再静默落成 epoch 0。

## 5. 回归验证

已补充单元测试覆盖：

- `{"startTime":""}` 解析为 `null`。
- `{"startTime":null}` 解析为 `null`。
- 毫秒时间戳字符串正常解析为 `LocalDateTime`。
- `2026-05-22 10:30:45` 字符串正常解析为 `LocalDateTime`。

已执行验证命令：

```bash
mvn -pl yudao-framework/yudao-common test
mvn -pl yudao-module-rscx -am test
mvn -pl yudao-server -am -DskipTests compile
```

验证结果均通过。

## 6. 数据修复建议

代码修复不会自动修复历史脏数据。对已经写入 `1970-01-01 08:00:00` 的权益券模板，需要按业务含义处理：

- 如果发放时间不限制，建议将对应 `start_time` 或 `end_time` 更新为 `NULL`。
- 如果有明确发放窗口，建议重新在后台编辑并保存正确时间。

参考排查 SQL：

```sql
SELECT id, template_code, coupon_name, start_time, end_time
FROM rscx_coupon_template
WHERE start_time = '1970-01-01 08:00:00'
   OR end_time = '1970-01-01 08:00:00';
```

参考修复 SQL：

```sql
UPDATE rscx_coupon_template
SET end_time = NULL
WHERE end_time = '1970-01-01 08:00:00';
```

执行修复 SQL 前应先备份数据，并结合具体模板的业务发放周期确认是否应置空。

## 7. 后续防护

- 日期/时间字段的后端反序列化必须显式处理空值和非法格式。
- 对影响业务判断的时间字段，应在服务层保留有效性校验。
- 对自动发券等关键链路，需要记录重算日志和发券结果，避免“未发券但无可追踪原因”的问题再次出现。
