import * as React from 'react';
import { MangaAndPage } from '../common';

interface MangaQuizProps {
  mangaAndPage: MangaAndPage;
}

interface MangaQuizState {
  selectedOption: SelectedOption;
}

enum SelectedOption {
  Yes,
  No,
  None,
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class MangaQuiz extends React.Component<MangaQuizProps, MangaQuizState> {
  constructor(props: MangaQuizProps) {
    super(props);
    this.state = {
      selectedOption: SelectedOption.None,
    };
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }

  handleOptionChange(ev: React.ChangeEvent<HTMLInputElement>) {
    ev.persist();
    this.setState((prevState, _) => {
      return {
        ...prevState,
        selectedOption: ev.target.value === 'yes' ? SelectedOption.Yes : SelectedOption.No,
      };
    });
  }

  public render() {
    return (
      <div>
        <div>
          <img src={this.props.mangaAndPage.pageUrl} />
        </div>
        <label>
          <input
            type="radio"
            value="yes"
            checked={this.state.selectedOption === SelectedOption.Yes}
            onChange={this.handleOptionChange}
          />
          yes
        </label>
        <label>
          <input
            type="radio"
            value="no"
            checked={this.state.selectedOption === SelectedOption.No}
            onChange={this.handleOptionChange}
          />
          no
        </label>
      </div>
    );
  }
}
