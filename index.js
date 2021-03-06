/*
  @flow weak
 */

import React from 'react'; // peer-dependency
import mitt from 'mitt'; // DEPENDENCY #1
import PropTypes from 'prop-types'; // DEPENDENCY #2, sorta

if (!PropTypes) console.warn('<react-native-portal> no PropTypes available');

const oContextTypes = {
  portalSub: PropTypes.func,
  portalUnsub: PropTypes.func,
  portalSet: PropTypes.func,
  portalGet: PropTypes.func,
};

export class PortalProvider extends React.Component {
  _emitter: *;
  static childContextTypes = oContextTypes;

  portals = new Map();

  getChildContext() {
    return {
      portalSub: this.portalSub,
      portalUnsub: this.portalUnsub,
      portalSet: this.portalSet,
      portalGet: this.portalGet,
    };
  }

  componentWillMount() {
    this._emitter = new mitt();
  }

  componentWillUnmount() {
    this._emitter = null;
  }

  // Registration of notification requests when changes are made
  portalSub = (name, callback) => {
    const emitter = this._emitter;
    if (emitter) {
      emitter.on(name, callback);
    }
  };

  // Release notification request when changing
  portalUnsub = (name, callback) => {
    const emitter = this._emitter;
    if (emitter) {
      emitter.off(name, callback);
    }
  };

  // on change
  portalSet = (name, value) => {
    this.portals.set(name, value);
    if (this._emitter) {
      this._emitter.emit(name);
    }
  };

  portalGet = name => this.portals.get(name) || null;

  // 변경
  render() {
    return this.props.children;
  }
}

export class BlackPortal extends React.Component {
  static contextTypes = oContextTypes;
  props: {
    name: string,
    children?: *,
  };
  componentDidMount() {
    const { name, children } = this.props;
    const { portalSet } = this.context;
    portalSet && portalSet(name, children);
  }
  shouldComponentUpdate(nextProps) {
    const oldProps = this.props;
    const { name, children } = nextProps;
    const { portalSet } = this.context;
    if (oldProps.children !== nextProps.children) {
      portalSet && portalSet(name, children);
    }
    return false
  }
  componentWillUnmount() {
    const { name } = this.props;
    const { portalSet } = this.context;
    portalSet && portalSet(name, null);
  }
  render() {
    return null;
  }
}

export class WhitePortal extends React.PureComponent {
  static contextTypes = oContextTypes;
  props: {
    name: string,
    children?: *,
    childrenProps?: *,
  };
  componentDidMount() {
    const { name } = this.props;
    const { portalSub } = this.context;
    portalSub && portalSub(name, this.forceUpdater);
  }
  componentWillUnmount() {
    const { name } = this.props;
    const { portalUnsub } = this.context;
    portalUnsub && portalUnsub(name, this.forceUpdater);
  }
  forceUpdater = () => this.forceUpdate();

  render() {
    const { name, children, childrenProps } = this.props;
    const { portalGet } = this.context;
    const portalChildren = (portalGet && portalGet(name)) || children;
    return (
      (childrenProps && portalChildren
        ? React.cloneElement(React.Children.only(portalChildren), childrenProps)
        : portalChildren) || null
    );
  }
}
