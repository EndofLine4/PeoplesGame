import { Router, Route } from 'preact-router';
import { Landing } from './pages/Landing';
import { Host } from './pages/Host';
import { Play } from './pages/Play';

export function App() {
  return (
    <Router>
      <Route path="/" component={Landing} />
      <Route path="/host" component={Host} />
      <Route path="/play" component={Play} />
    </Router>
  );
}
