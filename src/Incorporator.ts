import {PureComponent, createElement, createRef} from 'react';
import {Scope} from './scope';

type Props = {
  targetProps: any;
  targetRef: any;
  target: any;
  scope: Scope;
};

type State = {
  flip: boolean;
};

let moduleEntries: any = []

let onMounts: any[] = []
let onUpdates: any[] = []
let onUnmounts: any[] = []

export function setModules(mods: any) {
  if (mods === null || typeof mods !== 'object') return;
  moduleEntries = Object.entries(mods)
  onMounts = moduleEntries.map(mod => [mod[0], mod[1].componentDidMount]).filter(mod => mod[1])
  onUpdates = moduleEntries.map(mod => [mod[0], mod[1].componentDidUpdate]).filter(mod => mod[1])
  onUnmounts = moduleEntries.map(mod => [mod[0], mod[1].componentWillUnmount]).filter(mod => mod[1])
}

export function hasModuleProps (props) {
  return props 
    ? moduleEntries.some(([mkey]) => props.hasOwnProperty(mkey)) 
    : false
}

function moduleProcessor (base, ref, props) {
  if (ref && ref.current && base.length) {
    base.forEach(([key, f]) => {
      const prop = props[key]
      if (prop) f(ref.current, prop)
    });
  }

}

export default class Incorporator extends PureComponent<Props, State> {
  private ref: any;
  private moduleProps: string;

  constructor(props: Props) {
    super(props);
    this.state = {flip: false};
    this.selector = props.targetProps.sel;
    this.ref = props.targetRef || (moduleEntries.some(e => Object.keys(props.targetProps).some(key => key === e[0])) ? createRef() : null);
  }

  private selector: string | symbol;
  private unsubscribe: any;

  public componentDidMount() {
    this.unsubscribe = this.props.scope.subscribe(this.selector, () => {
      this.setState((prev: any) => ({flip: !prev.flip}));
    });

    moduleProcessor(onMounts, this.ref, this.props.targetProps)
  }

  public componentDidUpdate() {
    moduleProcessor(onUpdates, this.ref, this.props.targetProps)
  }

  private incorporateHandlers<P>(props: P, scope: Scope): P {
    const handlers = scope.getSelectorHandlers(this.selector);
    for (const evType of Object.keys(handlers)) {
      const onFoo = `on${evType[0].toUpperCase()}${evType.slice(1)}`;
      props[onFoo] = (ev: any) => handlers[evType]._n(ev);
    }
    return props;
  }

  private materializeTargetProps() {
    const {targetProps, scope} = this.props;
    let output = {...targetProps};
    output = this.incorporateHandlers(output, scope);
    if (this.ref) {
      output.ref = this.ref;
    }
    delete output.sel;
    moduleEntries.forEach(pair => delete output[pair[0]])
    return output;
  }

  public render() {
    const {target} = this.props;
    const targetProps = this.materializeTargetProps();

    if (targetProps.children) {
      return createElement(target, targetProps, targetProps.children);
    } else {
      return createElement(target, targetProps);
    }
  }

  public componentWillUnmount() {
    moduleProcessor(onUnmounts, this.ref, this.props.targetProps)

    this.unsubscribe();
  }
}
