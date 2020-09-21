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
  domHook?: any
  domClass?: any
};

type PropsLike<P> = P & PropsExtensions & Attributes;

type Children = string | Array<ReactNode>;

export function domClassify(Comp: any): ComponentType<any> {
  class DomProps extends Component<any, any> {
    private ref: any;
    private additionalClassname: string;
    constructor(props) {
      super(props);
      this.additionalClassname = this.props.domClass 
        ? (' ' + Object.entries(this.props.domClass).filter(x => x[1]).map(x => x[0]).join(' '))
        : ''
      this.ref = props.forwardedRef || createRef();
    }

    render() {
      const p: any = {
        ref: this.ref, 
        ...this.props, 
        className: (this.props.className || '') + this.additionalClassname
      }
      delete p.forwardedRef
      delete p.domClass;
      return createElement(Comp, p);
    }
  }

  return forwardRef((props, ref) => {
    return createElement(DomProps, {...props, forwardedRef: ref});
  });
}

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
    private hook: any;
    constructor(props) {
      super(props);
      this.hook = this.props.domHook;
      this.ref = props.forwardedRef || createRef();
    }

    public componentDidMount() {
      if (this.hook && this.hook.insert && this.ref) {
        this.hook.insert({elm: this.ref.current})
      }
    }

    public componentDidUpdate() {
      if (this.hook && this.hook.update && this.ref) {
        this.hook.update({elm: this.ref.current})
      }
    }

    public componentWillUnmount() {
      if (this.hook && this.hook.destroy && this.ref) {
        this.hook.destroy({elm: this.ref.current})
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
  if (!props.sel && !props.domClass && !props.domHook) {
    return createElement(type, props);
  } else {
    return createElement(domHookify(domPropify(domClassify(incorporate(type)))), props);
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
  if (!props.sel && !props.domClass && !props.domHook) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(domHookify(domPropify(domClassify(incorporate(type)))), props, children);
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
