import React, { Component } from "react";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkRenderWindowInteractor from "@kitware/vtk.js/Rendering/Core/RenderWindowInteractor";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";

import "@kitware/vtk.js/Rendering/Profiles/Geometry"; //gloub i bruche das

import vtkConeSource from "@kitware/vtk.js/Filters/Sources/ConeSource";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";

import vtkHttpDataSetReader from "@kitware/vtk.js/IO/Core/HttpDataSetReader";
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
//import vtkInteractorStyleImage from "vtk.js/Sources/Interaction/Style/InteractorStyleImage";
import "@kitware/vtk.js/IO/Core/DataAccessHelper";
import ImageConstants from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";

const { SlicingMode } = ImageConstants;

class ImageRenderer extends Component {
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
      // Rendering Setup
      const renderWindow = vtkRenderWindow.newInstance();
      const renderer = vtkRenderer.newInstance();
      renderWindow.addRenderer(renderer);

      const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
      renderWindow.addView(openGLRenderWindow);
      openGLRenderWindow.setContainer(this.vtkContainerRef.current);
      const { width, height } =
        this.vtkContainerRef.current.getBoundingClientRect();
      openGLRenderWindow.setSize(width, height);

      // Setup for interactor
      const interactor = vtkRenderWindowInteractor.newInstance();
      interactor.setView(openGLRenderWindow);
      interactor.initialize();
      interactor.setContainer(this.vtkContainerRef.current);

      // Initialize and set the mapper and actor
      const mapper = vtkImageMapper.newInstance();
      //mapper.setInputData(imageData);

      mapper.setSliceAtFocalPoint(true);
      mapper.setSlicingMode(SlicingMode.Z);

      const actor = vtkImageSlice.newInstance();
      actor.setMapper(mapper);

      actor.getProperty().setColorWindow(255);
      actor.getProperty().setColorLevel(127);

      const reader = vtkHttpDataSetReader.newInstance();

      // wire up the reader to the mapper
      mapper.setInputConnection(reader.getOutputPort());

      reader
        .setUrl("https://kitware.github.io/vtk-js/data/volume/LIDC2.vti")
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

      // Place actor and reset camera
      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();

      this.vtkContext = {
        initialized: true,
        renderWindow,
        openGLRenderWindow,
        interactor,
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

export default ImageRenderer;
