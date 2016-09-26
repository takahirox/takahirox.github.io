var debug = require('../utils/debug');
var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');

var warn = debug('components:mmd-model:warn');

module.exports.Component = registerComponent('mmd-model', {

  schema: {
    vmd: {type: 'src'},
    vpd: {type: 'src'},
    obj: {type: 'src'}
  },

  init: function () {
    this.model = null;
    this.loader = new THREE.MMDLoader();
    this.helper = new THREE.MMDHelper({autoClear: true, autoClearColor: true, autoClearDepth: false});
  },

  update: function () {
    var data = this.data;
    if (!data.obj) { return; }
    this.remove();
    this.loadObj(data.obj, data.vmd, data.vpd);
  },

  remove: function () {
    if (!this.model) { return; }
    this.el.removeObject3D('mesh');
  },

  loadObj: function (objUrl, vmdUrl, vpdUrl) {
    var self = this;
    var el = this.el;
    var loader = this.loader;
    var helper = this.helper;
    var texturePath = objUrl.slice(0, objUrl.lastIndexOf('/')) + '/../default/';
    loader.setDefaultTexturePath(texturePath);

    loader.loadModel(objUrl, function (model) {
      self.model = model;

      helper.add(model);

      if (el.getAttribute('physics') === 'true') {
        helper.setPhysics(model);
      }

      el.setObject3D('mesh', model);
      el.emit('model-loaded', {format: 'mmd', model: model});

      if (!vmdUrl && vpdUrl) {
        loader.loadVpd(vpdUrl, function (vpd) {
          helper.poseAsVpd(model, vpd);
        });
      }

      if (vmdUrl) {
        loader.loadVmd(vmdUrl, function (vmd) {
          loader.pourVmdIntoModel(model, vmd);
          helper.setAnimation(model);
        });
      }

    });
  },

  tick: function (time, delta) {
    if(this.model) {
      this.helper.animate(delta/1000.0);
    }
  },

  finalize: function () {
    if(this.model) {
      this.helper.restoreBones(this.model);
    }
  }
});
