/// <reference types="react-scripts" />

declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

