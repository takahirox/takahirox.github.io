var meshMixin = require('../getMeshMixin')();
var registerPrimitive = require('../primitives').registerPrimitive;
var utils = require('../../../utils/');

registerPrimitive('a-mmd-model', utils.extendDeep({}, meshMixin, {
  mappings: {
    src: 'mmd-model.obj',
    vmd: 'mmd-model.vmd',
    vpd: 'mmd-model.vpd'
  },

  transforms: {
    mtl: meshMixin.transforms.src
  }
}));
