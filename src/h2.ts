import {
  createElement,
  ReactElement,
  ReactNode,
  ElementType,
  ReactHTML,
  Attributes,
  Component,
  ComponentType,
  createRef,
  forwardRef
} from 'react';
import {incorporate} from './incorporate';

export type PropsExtensions = {
  sel?: string | symbol;
  domProps?: any
};

type PropsLike<P> = P & PropsExtensions & Attributes;

type Children = string | Array<ReactNode>;

export function domPropify(Comp: any): ComponentType<any> {
  class DomProps extends Component<any, any> {
    private ref: any;
    private domProps: any;
    constructor(props) {
      super(props);
      this.domProps = this.props.domProps;
      this.ref = props.forwardedRef || createRef();
    }

    public componentDidMount() {
      if (this.domProps && this.ref) {
        Object.entries(this.domProps).forEach(([key, val]) => {
          this.ref.current[key] = val;
        });
      }
    }

    render() {
      const p: any = {ref: this.ref, ...this.props};
      delete p.forwardedRef
      delete p.domProps;
      return createElement(Comp, p);
    }
  }

  return forwardRef((props, ref) => {
    return createElement(DomProps, {...props, forwardedRef: ref});
  });
}

export function domHookify(Comp: any): ComponentType<any> {
  class DomHooks extends Component<any, any> {
    private ref: any;
    private hooks: any;
    constructor(props) {
      super(props);
      this.hooks = this.props.domHooks;
      this.ref = props.forwardedRef || createRef();
    }

    public componentDidMount() {
      if (this.hooks && this.hooks.insert && this.ref) {
        this.hooks.insert({elm: this.ref.current})
      }
    }

    public componentDidUpdate() {
      if (this.hooks && this.hooks.update && this.ref) {
        this.hooks.update({elm: this.ref.current})
      }
    }

    public componentWillUnmount() {
      if (this.hooks && this.hooks.destroy && this.ref) {
        this.hooks.destroy({elm: this.ref.current})
      }
    }

    render() {
      const p: any = {ref: this.ref, ...this.props};
      delete p.forwardedRef
      delete p.domHooks;
      return createElement(Comp, p);
    }
  }

  return forwardRef((props, ref) => {
    return createElement(DomHooks, {...props, forwardedRef: ref});
  });
}

function createElementSpreading<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P> | null,
  children: Children,
): ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

function hyperscriptProps<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P>,
): ReactElement<P> {
  if (!props.sel) {
    return createElement(type, props);
  } else {
    return createElement(domHookify(domPropify(incorporate(type))), props);
  }
}

function hyperscriptChildren<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  children: Children,
): ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P>,
  children: Children,
): ReactElement<P> {
  if (!props.sel) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(domHookify(domPropify(incorporate(type))), props, children);
  }
}

export function h2<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  a?: PropsLike<P> | Children,
  b?: Children,
): ReactElement<P> {
  if (a === undefined && b === undefined) {
    return createElement(type, null);
  }
  if (b === undefined && (typeof a === 'string' || Array.isArray(a))) {
    return hyperscriptChildren(type, a as Array<ReactNode>);
  }
  if (b === undefined && typeof a === 'object' && !Array.isArray(a)) {
    return hyperscriptProps(type, a);
  }
  if (
    a !== undefined &&
    typeof a !== 'string' &&
    !Array.isArray(a) &&
    b !== undefined
  ) {
    return hyperscriptPropsChildren(type, a, b);
  } else {
    throw new Error('Unexpected usage of h() function');
  }
}
