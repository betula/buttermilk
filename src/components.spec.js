import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';

import { Link, Router, RoutingState } from './components';

let root;
const render = props => ReactDOM.render(<Router {...props} />, root);

beforeAll(() => document.body.appendChild((root = document.createElement('main'))));
beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
afterEach(() => ReactDOM.unmountComponentAtNode(root));

describe('Router', () => {
    it('renders a simple element child', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <div>bar</div>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(root.innerHTML).toContain('bar');
    });

    it('renders a child component class with the current routing state', () => {
        class Foo extends React.Component {
            render() {
                return JSON.stringify(this.props);
            }
        }

        render({
            routes: [{
                path: '/foo',
                render: () => Foo,
            }],
            url: 'http://foo.com/foo',
        });

        expect(JSON.parse(root.innerHTML)).toMatchObject({
            location: {
                href: 'http://foo.com/foo',
                params: {},
                pathname: '/foo',
                query: {},
            },
        });
    });

    it('warns if no fallback route was provided', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <div>bar</div>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(console.warn).toHaveBeenCalled();
    });

    it('does not warn if a fallback route was provided', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <div>bar</div>,
            }, {
                path: '*',
                render: () => <div>oh well</div>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(console.warn).not.toHaveBeenCalled();
    });

    it('handles popstate events', () => {
        const instance = render({
            routes: [{
                path: '/foo',
                render: () => <div>bar</div>,
            }, {
                path: '*',
                render: () => <div>oh well</div>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(root.innerHTML).toContain('bar');

        jest.spyOn(instance, 'getURL').mockImplementation(() => 'http://foo.com/bar');
        window.dispatchEvent(new Event('popstate'));

        expect(root.innerHTML).toContain('oh well');
    });

    it('handles hashchange events', () => {
        const instance = render({
            routes: [{
                path: '#foo',
                render: () => <div>bar</div>,
            }, {
                path: '*',
                render: () => <div>oh well</div>,
            }],
            url: 'http://foo.com/#foo',
        });

        expect(root.innerHTML).toContain('bar');

        jest.spyOn(instance, 'getURL').mockImplementation(() => 'http://foo.com/');
        window.dispatchEvent(new Event('hashchange'));

        expect(root.innerHTML).toContain('oh well');
    });
});

describe('RoutingState', () => {
    it('inherits the routing state from the parent Router', () => {
        class Foo extends React.Component {
            render() {
                return (
                    <div id="inner">
                        <RoutingState>
                            {state => {
                                return JSON.stringify(state);
                            }}
                        </RoutingState>
                    </div>
                );
            }
        }

        render({
            routes: [{
                path: '/foo',
                render: () => Foo,
            }],
            url: 'http://foo.com/foo',
        });

        expect(JSON.parse(root.querySelector('#inner').innerHTML)).toMatchObject({
            location: {
                href: 'http://foo.com/foo',
                params: {},
                pathname: '/foo',
                query: {},
            },
        });
    });

    it('reflects updates in routing state', () => {
        class Foo extends React.Component {
            render() {
                return (
                    <div id="inner">
                        <RoutingState>
                            {state => {
                                return JSON.stringify(state);
                            }}
                        </RoutingState>
                    </div>
                );
            }
        }

        const instance = render({
            routes: [{
                path: '/foo(/:id)',
                render: () => Foo,
            }],
            url: 'http://foo.com/foo',
        });

        expect(JSON.parse(root.querySelector('#inner').innerHTML)).toMatchObject({
            location: {
                href: 'http://foo.com/foo',
                params: {},
                pathname: '/foo',
                query: {},
            },
        });

        jest.spyOn(instance, 'getURL').mockImplementation(() => 'http://foo.com/foo/bar');
        window.dispatchEvent(new Event('popstate'));

        expect(JSON.parse(root.querySelector('#inner').innerHTML)).toMatchObject({
            location: {
                href: 'http://foo.com/foo/bar',
                pathname: '/foo/bar',
                query: {},
            },
            params: {
                id: 'bar',
            },
        });
    });
});

describe('Link', () => {
    beforeEach(() => {
        jest.spyOn(history, 'pushState').mockImplementation(() => {});
        jest.spyOn(window, 'open').mockImplementation(() => {});
    });

    it('renders as an anchor tag by default', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(root.innerHTML).toMatchSnapshot();
    });

    it('renders as a different component if provided', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link as="div" href="/bar">Baz</Link>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(root.innerHTML).toMatchSnapshot();
    });

    it('sets [data-active] if the link href matches the active route', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/foo">Baz</Link>,
            }],
            url: 'http://foo.com/foo',
        });

        expect(root.innerHTML).toMatchSnapshot();
    });

    it('changes the routing state on click', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.click(root.querySelector('a'));

        expect(history.pushState).toHaveBeenCalledWith({}, '', '/bar');
    });

    it('changes the routing state on touch end', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.touchEnd(root.querySelector('a'));

        expect(history.pushState).toHaveBeenCalledWith({}, '', '/bar');
    });

    it('changes the routing state on enter press', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.keyDown(root.querySelector('a'), {
            key: 'Enter',
        });

        expect(history.pushState).toHaveBeenCalledWith({}, '', '/bar');
    });

    it('changes the routing state on space press', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.keyDown(root.querySelector('a'), {
            key: 'Space',
        });

        expect(history.pushState).toHaveBeenCalledWith({}, '', '/bar');
    });

    it('opens a new tab if metaKey is pressed while clicking the link', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.click(root.querySelector('a'), {
            metaKey: true,
        });

        expect(window.open).toHaveBeenCalledWith('/bar');
        expect(history.pushState).not.toHaveBeenCalled();
    });

    it('opens a new tab if target is set to _blank', () => {
        render({
            routes: [{
                path: '/foo',
                render: () => <Link href="/bar" target="_blank">Baz</Link>,
            }, {
                path: '/bar',
                render: () => 'It worked.',
            }],
            url: 'http://foo.com/foo',
        });

        Simulate.click(root.querySelector('a'));

        expect(window.open).toHaveBeenCalledWith('/bar');
        expect(history.pushState).not.toHaveBeenCalled();
    });
});
