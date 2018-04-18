import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { IManga, Manga } from '../common';
import { Hello } from './Hello';

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class App extends React.Component<{}, {}> {
  public componentDidMount() {
    fetch('/api/randommanga?n=20')
      .then((resp) => resp.json())
      .then((json: IManga[]) => {
        const mga: Manga[] = [];
        for (const m of json) {
          mga.push(new Manga(m.id, m.name, m.url, m.isShoujo));
        }
        this.setState((prevState, _) => {
          return { ...prevState, manga: mga };
        });
      })
      .catch((e) => console.error(e));
  }

  public render() {
    return <Hello compiler="compiler" framework="react"/>;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
