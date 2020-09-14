import {createElement, forwardRef, createRef} from 'react';
import {Scope} from './scope';
import {ScopeContext} from './context';
import Incorporator from './Incorporator';

const wrapperComponents: Map<any, React.ComponentType<any>> = new Map();

export function incorporate(type: any) {
  if (!wrapperComponents.has(type)) {
    wrapperComponents.set(
      type,
      forwardRef<any, any>((props, ref) =>
        createElement(ScopeContext.Consumer, null, (scope: Scope) => {
            let targetRef = ref
            if (!ref && props.domProps) {
              targetRef = createRef()
            }
            return createElement(Incorporator, {
              targetProps: props,
              targetRef,
              target: type,
              scope: scope,
            })
          }
        ),
      ),
    );
  }
  return wrapperComponents.get(type) as React.ComponentType<any>;
}
