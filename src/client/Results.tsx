import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { QuizResponse, QuizResult } from '../common';

interface ResultProps {
  result: QuizResult;
}

class Result extends React.Component<ResultProps, {}> {
  public render() {
    let yourAnswer = '';
    if (this.props.result.manga.isShoujo) {
      yourAnswer = this.props.result.correct ? 'yes' : 'no';
    } else {
      yourAnswer = this.props.result.correct ? 'no' : 'yes';
    }
    const manga = this.props.result.manga;
    return (
      <div className="result">
        Manga: <a href={manga.url}>{manga.name}</a>
        <br />
        Shoujo? {manga.isShoujo ? <span>yes</span> : <span>no</span>}
        <br />
        Your answer:{' '}
        <span className={this.props.result.correct ? 'correct' : 'incorrect'}>{yourAnswer}</span>
        <br />
        Total correct: {manga.correct}
        <br />
        Total guesses: {manga.total}
        <br />
      </div>
    );
  }
}

interface ResultsState {
  results: QuizResponse | null;
}

export class Results extends React.Component<{}, ResultsState> {
  constructor(props) {
    super(props);
    this.state = {
      results: null,
    };
  }

  public componentDidMount() {
    fetch(`/api/results`, {
      credentials: 'include',
    })
      .then((resp) => resp.json())
      .then((results: QuizResponse) => {
        this.setState((prevState) => {
          return {
            ...prevState,
            results,
          };
        });
      })
      .catch((e) => console.error(e));
  }

  public render() {
    if (this.state.results === null) {
      return <div />;
    } else {
      const results = this.state.results.results;
      const userAggregateStats = this.state.results.stats;
      const [correct, total] = results.reduce(
        (acc, res) => (res.correct ? [acc[0] + 1, acc[1] + 1] : [acc[0], acc[1] + 1]),
        [0, 0],
      );
      const [shoujoCorrect, shoujoTotal] = results.reduce(
        (acc, res) => {
          if (res.manga.isShoujo) {
            if (res.manga.correct) {
              return [acc[0] + 1, acc[1] + 1];
            } else {
              return [acc[0], acc[1] + 1];
            }
          } else {
            return acc;
          }
        },
        [0, 0],
      );
      return (
        <div>
          <div>{results.map((r, i) => <Result key={i} result={r} />)}</div>
          <div>
            Correct: {correct} out of {total} ({Math.round(correct / total * 100)}%)
          </div>
          <div>
            Correct for shoujo: {shoujoCorrect} out of {shoujoTotal} ({Math.round(correct / total * 100)}%)
          </div>
          <div>
            On average, users have been correct {Math.round(userAggregateStats.average * 100)}% of
            the time.
          </div>
          <a href="/">Try again!</a>
        </div>
      );
    }
  }
}
