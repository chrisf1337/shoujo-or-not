import * as React from 'react';
import * as ReactDOM from 'react-dom';
import _ from 'lodash';

import { MangaAndPage, Manga, SelectedOption, QuizAnswer } from '../common';
import { MangaQuiz } from './MangaQuiz';

interface AppState {
  mangaAndPages: MangaAndPage[];
  refreshing: boolean[];
  answers: SelectedOption[];
  loading: boolean;
}

const N_MANGA = 5;

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class QuizApp extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      mangaAndPages: [],
      refreshing: new Array(N_MANGA).fill(false),
      answers: new Array(N_MANGA).fill(SelectedOption.No),
      loading: true,
    };
    this.refresh.bind(this);
    this.handleOptionChange.bind(this);
  }

  public componentDidMount() {
    fetch(`/api/randommanga?n=${N_MANGA}`, {
      credentials: 'include',
    })
      .then((resp) => resp.json())
      .then((json: MangaAndPage[]) => {
        this.setState((prevState) => {
          return {
            ...prevState,
            mangaAndPages: json,
            loading: false,
          };
        });
      })
      .catch((e) => console.error(e));
  }

  private refresh(i: number): () => void {
    return () => {
      const refreshing = this.state.refreshing;
      refreshing[i] = true;
      this.setState((prevState) => {
        return { ...prevState, refreshing };
      });
      const mangaAndPages = this.state.mangaAndPages;
      const mangaId = mangaAndPages[i].mangaId;
      fetch(`/api/randompage?id=${mangaId}`, {
        credentials: 'include',
      })
        .then((resp) => resp.json())
        .then((newUrl) => {
          mangaAndPages[i].pageUrl = newUrl;
          // const refreshing = this.state.refreshing;
          // refreshing[i] = false;
          this.setState((prevState) => {
            return { ...prevState, mangaAndPages };
          });
        });
    };
  }

  private imgOnLoad(i: number) {
    return (ev) => {
      const refreshing = this.state.refreshing;
      refreshing[i] = false;
      this.setState((prevState) => {
        return { ...prevState, refreshing };
      });
    };
  }

  private handleOptionChange(i: number) {
    return (ev: React.ChangeEvent<HTMLInputElement>) => {
      ev.persist();
      const answers = this.state.answers;
      answers[i] = ev.target.value === 'yes' ? SelectedOption.Yes : SelectedOption.No;
      this.setState((prevState) => {
        return {
          ...prevState,
          answers,
        };
      });
    };
  }

  private submit() {
    const answers: QuizAnswer[] = [];
    for (let i = 0; i < N_MANGA; i++) {
      answers.push({
        id: this.state.mangaAndPages[i].mangaId,
        isShoujo: this.state.answers[i] === SelectedOption.Yes,
      });
    }
    fetch(`/api/update`, {
      body: JSON.stringify(answers),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
    })
      .then((resp) => resp.json())
      .then(() => window.location.pathname = '/results.html');
  }

  public render() {
    return (
      <div>
        {this.state.loading ? <div>Loading...</div> : null}
        {this.state.mangaAndPages.map((mangaAndPage, i) => (
          <MangaQuiz
            key={i}
            mangaAndPage={mangaAndPage}
            selectedOption={this.state.answers[i]}
            refresh={this.refresh(i)}
            refreshing={this.state.refreshing[i]}
            handleOptionChange={this.handleOptionChange(i)}
            imgOnLoad={this.imgOnLoad(i)}
          />
        ))}
        <button onClick={this.submit.bind(this)}>Submit</button>
      </div>
    );
  }
}
