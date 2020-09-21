import {PureComponent, createElement} from 'react';
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

export default class Incorporator extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {flip: false};
    this.selector = props.targetProps.sel;
  }

  private selector: string | symbol;
  private unsubscribe: any;

  public componentDidMount() {
    this.unsubscribe = this.props.scope.subscribe(this.selector, () => {
      this.setState((prev: any) => ({flip: !prev.flip}));
    });
  }

  public componentDidUpdate(prevProps, prevState) {
    const x = this
    const {domProps} = this.props.targetProps
    if (domProps && this.props.targetRef) {
      Object.entries(domProps)
        .forEach(([key, val]) => { 
          this.props.targetRef.current[key] = val 
        })
    }
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
    const {targetProps, targetRef, scope} = this.props;
    let output = {...targetProps};
    output = this.incorporateHandlers(output, scope);
    if (targetRef) {
      output.ref = targetRef;
    }
    delete output.sel;
    delete output.domProps
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
    this.unsubscribe();
  }
}
