import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { QuizApp } from './QuizApp';
import { Results } from './Results';

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  ReactDOM.render(<QuizApp />, document.getElementById('app'));
} else if (window.location.pathname === '/results.html') {
  ReactDOM.render(<Results />, document.getElementById('app'));
}
