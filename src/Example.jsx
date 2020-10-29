import React from 'react';
import ReactDOM from 'react-dom';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import 'Style/CssLoader';

if (process.env.NODE_ENV === 'development') {
  const stylesheet = document.createElement('style');
  stylesheet.innerHTML = `
    /* For development, this needs to be injected before stylesheet, else \`react-reflex\` panel dimension calculation will be off */
    .reflex-container { height: 100%; width: 100%; }
    .reflex-container.horizontal { flex-direction: column; min-height: 1px; }
    .reflex-container.vertical { flex-direction: row; min-width: 1px; }
    .reflex-container > .reflex-element { height: 100%; width: 100%; }
    .reflex-container > .reflex-element > .reflex-size-aware { height: 100%; width: 100%; }`;
  document.head.prepend(stylesheet);
}

/////////////////////////////////////////////////////////
class ControlledElement extends React.Component {

  constructor(props) {

    super(props);

    this.onLockSizeClicked = this.onLockSizeClicked.bind(this);
    this.onMinimizeClicked = this.onMinimizeClicked.bind(this);
    this.onMaximizeClicked = this.onMaximizeClicked.bind(this);

    this.state = {
      size: -1
    };
  }

  onLockSizeClicked() {

    this.props.onLockSize({
      locked: this.props.sizeLocked,
      paneId: this.props.id,
      size: this.getSize()
    });
  }

  onMinimizeClicked() {

    // const currentSize = this.getSize();

    // const update = size => new Promise(resolve => {

    //   this.setState(Object.assign({},
    //     this.state, {
    //     size: size < 25 ? 25 : size
    //   }), () => resolve());
    // });

    // const done = (from, to) => from < to;

    // this.animate(
    //   currentSize, 25, -8,
    //   done, update);

      this.setState(Object.assign({},
        this.state, {
        size: 25
      }));
  }

  onMaximizeClicked() {

    const currentSize = this.getSize();

    const update = size => new Promise(resolve => {

      this.setState(Object.assign({},
        this.state, {
        size
      }), () => resolve());
    });

    const done = (from, to) => from > to;
    

    this.animate(
      currentSize, 400, 1000,
      done, update);
  }

  getSize() {
    const domElement = ReactDOM.findDOMNode(this);
    switch (this.props.orientation) {
      case 'horizontal': return domElement.offsetHeight;
      case 'vertical': return domElement.offsetWidth;
      default: return 0;
    }
  }

  animate(from, to, step, done, fn) {

    const stepFn = () => {

      if (!done(from, to)) {

        fn(from += step).then(() => {

          setTimeout(stepFn, 8);
        });
      }
    };

    stepFn();
  }

  render() {

    const lockStyle = this.props.sizeLocked ?
      { color: '#FF0000' } : {};

    return (
      <ReflexElement size={this.state.size} {...this.props}>
        <div className="pane-content">
          <div className="pane-control">
            <label>
              {this.props.name}  Controls
            </label>
            <button onClick={this.onMaximizeClicked}>
              <label> + </label>
            </button>
            <button onClick={this.onMinimizeClicked}>
              <label> - </label>
            </button>
            <button onClick={this.onLockSizeClicked}>
              <label style={lockStyle} > = </label>
            </button>
          </div>
          <div className="ctrl-pane-content">
            <label>
              {this.props.name}
            </label>
          </div>
        </div>
      </ReflexElement>
    );
  }
}

class ReflexControlsDemo
  extends React.Component {

  constructor(props) {

    super(props);

    this.onLockSize =
      this.onLockSize.bind(this);

    this.state = {
      pane1: {
        onLockSize: this.onLockSize,
        sizeLocked: false,
        name: 'Pane 1',
        direction: 1,
        id: 'pane1',
        minSize: 25
      },
      pane2: {
        onLockSize: this.onLockSize,
        sizeLocked: false,
        name: 'Pane 2',
        direction: [1, -1],
        id: 'pane2',
        minSize: 25
      },
      pane3: {
        onLockSize: this.onLockSize,
        sizeLocked: false,
        name: 'Pane 3',
        direction: -1,
        id: 'pane3',
        minSize: 25
      }
    };
  }

  onLockSize(data) {

    const locked = !this.state[data.paneId].sizeLocked;

    this.state[data.paneId].sizeLocked = locked;

    if (locked) {

      this.state[data.paneId].minSize = data.size;
      this.state[data.paneId].maxSize = data.size;

    } else {

      this.state[data.paneId].minSize = 25;
      this.state[data.paneId].maxSize = Number.MAX_VALUE;
    }

    this.setState(Object.assign({}, this.state));
  }

  render() {

    return (
      <ReflexContainer orientation="vertical">

        <ReflexElement flex={0.4}>
          <div className="pane-content">
            <ReflexContainer orientation="horizontal">

              <ControlledElement {...this.state.pane1} />

              <ReflexSplitter propagate={true} />

              <ControlledElement {...this.state.pane2} />

              <ReflexSplitter propagate={true} />

              <ControlledElement {...this.state.pane3} />

            </ReflexContainer>
          </div>
        </ReflexElement>

        <ReflexSplitter />

        <ReflexElement>
          <div className="pane-content">
            <label>
              App Pane
            </label>
          </div>
        </ReflexElement>

      </ReflexContainer>
    );
  }
}

// ReactDOM.render(<ReflexControlsDemo />,
//   document.getElementById('demo-controls'));

const root = (() => {
  let rootEl = document.getElementsByTagName('root').length ? document.getElementsByTagName('root')[0] : undefined;
  if (!rootEl) {
    rootEl = document.createElement('root');
    document.body.appendChild(rootEl);
  }
  return rootEl;
})();

ReactDOM.render(<ReflexControlsDemo />, root);
