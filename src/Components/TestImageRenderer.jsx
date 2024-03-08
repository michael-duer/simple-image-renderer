import React, { Component } from "react";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";

class TestImageRenderer extends Component {
  constructor(props) {
    super(props);
    this.vtkContainerRef = React.createRef();
    this.vtkContext = { initialized: false };
  }

  componentDidMount() {
    this.initializeVTK();
  }

  componentWillUnmount() {
    this.destroyVTK();
  }

  initializeVTK() {
    if (this.vtkContainerRef.current && !this.vtkContext.initialized) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        background: [0, 0, 0],
      });
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      const reader = vtkXMLImageDataReader.newInstance();
      const actor = vtkVolume.newInstance();
      const mapper = vtkVolumeMapper.newInstance();
      const property = actor.getProperty();

      mapper.setSampleDistance(1.5);
      actor.setMapper(mapper);

      property.setInterpolationTypeToLinear();
      property.setIndependentComponents(false);
      mapper.setBlendModeToComposite();

      reader
        .setUrl("https://kitware.github.io/vtk-js/data/test2.vti")
        .then(() => {
          reader.loadData().then(() => {
            const ds = reader.getOutputData();
            const scalars = ds.getPointData().getScalars();
            const size = scalars.getNumberOfTuples();
            const rawArray = scalars.getData();
            const targetTupleSize = 4;
            const rgba = new Uint8ClampedArray(size * targetTupleSize);
            for (let i = 0; i < size; i++) {
              const offsetSrc = i * 3;
              const offsetDst = i * targetTupleSize;
              const l =
                0.3 * rawArray[offsetSrc + 0] +
                0.59 * rawArray[offsetSrc + 1] +
                0.11 * rawArray[offsetSrc + 2];

              rgba[offsetDst + 0] = rawArray[offsetSrc + 0];
              rgba[offsetDst + 1] = rawArray[offsetSrc + 1];
              rgba[offsetDst + 2] = rawArray[offsetSrc + 2];
              rgba[offsetDst + 3] = l;
            }

            const newScalarWithLuminance = vtkDataArray.newInstance({
              name: "rgba",
              values: rgba,
              numberOfComponents: targetTupleSize,
            });

            // Replace png RGB by RGBA with luminance
            ds.getPointData().setScalars(newScalarWithLuminance);

            mapper.setInputData(ds);
            renderer.addVolume(actor);
            renderer.resetCamera();
            renderWindow.render();
            console.log("ready...");
          });
        });

      this.vtkContext = {
        initialized: true,
        renderWindow,
      };
    }
  }

  destroyVTK() {
    if (this.vtkContext.initialized) {
      this.vtkContext.renderWindow.delete();
      this.vtkContext.openGLRenderWindow.delete();
      this.vtkContext.interactor.delete();
      this.vtkContext.initialized = false;
    }
  }

  render() {
    return (
      <div
        ref={this.vtkContainerRef}
        style={{
          width: "500px",
          height: "500px",
          border: "1px solid sandybrown",
        }}
      />
    );
  }
}

export default TestImageRenderer;
