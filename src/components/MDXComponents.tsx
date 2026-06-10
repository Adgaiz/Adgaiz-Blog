import React from 'react';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

export const components = {
  h2: (props: any) => {
    const id = slugify(props.children?.toString() || '');
    return <h2 id={id} {...props} />;
  },
  h3: (props: any) => {
    const id = slugify(props.children?.toString() || '');
    return <h3 id={id} {...props} />;
  },
};
