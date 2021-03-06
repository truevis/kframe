/* global assert, setup, suite, test */
require('aframe');
require('../index.js');
var entityFactory = require('./helpers').entityFactory;

AFRAME.registerReducer('foo', {
  initialState: {
    counter: 5,
    enabled: false
  },

  handlers: {
    fooAdd: (newState, payload) => {
      newState.counter += payload.number;
      return newState;
    },

    fooEnable: (newState, payload) => {
      newState.enabled = true;
      return newState;
    },

    fooSubtract: (newState, payload) => {
      newState.counter -= payload.number;
      return newState;
    }
  }
});

suite('state', function () {
  var el;

  setup(function (done) {
    el = entityFactory();
    setTimeout(() => {
      if (el.sceneEl.hasLoaded) {
        done();
        return;
      }
      el.sceneEl.addEventListener('loaded', () => {
        done();
      });
    });
  });

  suite('bind', () => {
    test('binds single-property component', done => {
      el.setAttribute('bind', 'visible: foo.enabled');
      assert.notOk(el.getAttribute('visible'));
      el.emit('fooEnable');
      setTimeout(() => {
        assert.ok(el.getAttribute('visible'));
        done();
      });
    });

    test('binds single-property component with namespace', done => {
      el.setAttribute('bind__visible', 'foo.enabled');
      assert.notOk(el.getAttribute('visible'));
      el.emit('fooEnable');
      setTimeout(() => {
        assert.ok(el.getAttribute('visible'));
        done();
      });
    });

    test('binds multi-property components', done => {
      // Components.
      AFRAME.registerComponent('bar', {schema: {barCounter: {default: 0}}});
      AFRAME.registerComponent('baz', {schema: {bazCounter: {default: 0}}});

      // Assert unbinded value.
      el.setAttribute('bar', '');
      assert.equal(el.getAttribute('bar').barCounter, 0);

      // Bind.
      el.setAttribute('bind', {'bar.barCounter': 'foo.counter', 'baz.bazCounter': 'foo.counter'});

      // Assert initial state bind values.
      assert.equal(el.getAttribute('bar').barCounter, 5);
      assert.equal(el.getAttribute('baz').bazCounter, 5);

      // Dispatch action.
      el.emit('fooAdd', {number: 10});

      setTimeout(() => {
        assert.equal(el.getAttribute('bar').barCounter, 15);
        assert.equal(el.getAttribute('baz').bazCounter, 15);
        delete AFRAME.components.bar;
        delete AFRAME.components.baz;
        done();
      });
    });

    test('binds multi-property component with namespace', done => {
      // Components.
      AFRAME.registerComponent('bar', {
        schema: {
          barCounter: {default: 0},
          barEnabled: {default: true}
        }
      });

      // Bind.
      el.setAttribute('bind__bar', {'barCounter': 'foo.counter', 'barEnabled': 'foo.enabled'});

      // Assert initial state bind values.
      assert.equal(el.getAttribute('bar').barCounter, 5);
      assert.equal(el.getAttribute('bar').barEnabled, false);

      // Dispatch action.
      el.emit('fooAdd', {number: 10});
      el.emit('fooEnable');

      setTimeout(() => {
        assert.equal(el.getAttribute('bar').barCounter, 15);
        assert.equal(el.getAttribute('bar').barEnabled, true);
        delete AFRAME.components.bar;
        done();
      });
    });

    test('batches update for multi-property component with namespace', () => {
      var spy = sinon.spy(el, 'setAttribute');

      // Components.
      AFRAME.registerComponent('bar', {
        schema: {
          barCounter: {default: 0},
          barEnabled: {default: true}
        }
      });

      // Bind.
      el.setAttribute('bind__bar', {'barCounter': 'foo.counter', 'barEnabled': 'foo.enabled'});


      assert.equal(spy.getCalls().length, 2);
      assert.shallowDeepEqual(spy.getCalls()[1].args[1],
                              {barCounter: 5, barEnabled: false});
      delete AFRAME.components.bar;
    });

    test('binds non-component attribute', done => {
      el.setAttribute('bind', 'data-enabled: foo.enabled');
      assert.equal(el.getAttribute('data-enabled'), 'false');
      el.emit('fooEnable');
      setTimeout(() => {
        assert.equal(el.getAttribute('data-enabled'), 'true');
        done();
      });
    });

    test('binds non-component attribute with namespace', done => {
      el.setAttribute('bind__data-enabled', 'foo.enabled');
      assert.equal(el.getAttribute('data-enabled'), 'false');
      el.emit('fooEnable');
      setTimeout(() => {
        assert.equal(el.getAttribute('data-enabled'), 'true');
        done();
      });
    });
  });
});
