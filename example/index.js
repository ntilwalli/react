import xs from 'xstream';
import {createElement} from 'react';
import {render} from 'react-dom';
import {h2, makeComponent} from '../src/index';

function main(sources) {
  const init$ = xs.of(() => 0);

  const increment$ = xs.periodic(1000).mapTo(x => x + 1);

  const btnSel = Symbol();

  const reset$ = sources.react
    .select(btnSel)
    .events('click')
    .debug((ev) => {
      return ev.target.printer()
    })
    .mapTo(() => 0);

  const count$ = xs
    .merge(init$, increment$, reset$)
    .fold((state, fn) => fn(state));

  const vdom$ = count$.map(i =>
    h2('div', [
      h2('h1', `Hello ${i} times`),
      h2('button', {sel: btnSel, className: 'clicker', domProps: {foo: 3}, domClass: {hello: true, goodbye: false}}, 'Reset'),
    ]),
  );

  return {
    react: vdom$,
  };
}

const App = makeComponent(main);

render(createElement(App), document.getElementById('app'));
