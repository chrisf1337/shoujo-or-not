import * as React from 'react';
import { MangaAndPage, SelectedOption } from '../common';
const style = require('./style.css');

interface MangaQuizProps {
  mangaAndPage: MangaAndPage;
  selectedOption: SelectedOption;
  refresh: () => void;
  refreshing: boolean;
  handleOptionChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  imgOnLoad: (ev: any) => void;
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class MangaQuiz extends React.Component<MangaQuizProps, {}> {
  public render() {
    return (
      <div>
        <div>
          <img onLoad={this.props.imgOnLoad} src={this.props.mangaAndPage.pageUrl} />
        </div>
        <label>
          <input
            type="radio"
            value="yes"
            checked={this.props.selectedOption === SelectedOption.Yes}
            onChange={this.props.handleOptionChange}
          />
          yes
        </label>
        <label>
          <input
            type="radio"
            value="no"
            checked={this.props.selectedOption === SelectedOption.No}
            onChange={this.props.handleOptionChange}
          />
          no
        </label>
        <button onClick={this.props.refresh} className="refresh-button">Refresh image</button>
        {this.props.refreshing ? <span>refreshing...</span> : null}
      </div>
    );
  }
}
