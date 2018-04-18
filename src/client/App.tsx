import * as React from 'react';
import * as ReactDOM from 'react-dom';
import _ from 'lodash';

import { MangaAndPage, Manga } from '../common';
import { MangaQuiz } from './MangaQuiz';

interface AppState {
  mangaAndPages: MangaAndPage[];
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      mangaAndPages: [],
    };
  }

  public componentDidMount() {
    fetch('/api/randommanga?n=5')
      .then((resp) => resp.json())
      .then((json: MangaAndPage[]) => {
        this.setState((prevState, _) => {
          return { ...prevState, mangaAndPages: json };
        });
      })
      .catch((e) => console.error(e));
  }
  public render() {
    console.log(this.state);
    return (
      <div>
        {this.state.mangaAndPages.map((mangaAndPage) => (
          <MangaQuiz key={mangaAndPage.manga.id} mangaAndPage={mangaAndPage} />
        ))}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
