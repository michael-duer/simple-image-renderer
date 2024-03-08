import React, { Component } from "react";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkRenderWindowInteractor from "@kitware/vtk.js/Rendering/Core/RenderWindowInteractor";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";

// imports for the cone example
import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import vtkConeSource from "@kitware/vtk.js/Filters/Sources/ConeSource";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";

class BasicImageRenderer extends Component {
  constructor(props) {
    super(props);
    // Initializing reference for the container and a context object to manage VTK state.
    this.vtkContainerRef = React.createRef();
    this.vtkContext = { initialized: false };
  }
  // Initialize VTK rendering setup after the component is mounted.
  componentDidMount() {
    this.initializeVTK();
  }
  // Cleanup the VTK setup before the component is unmounted and destroyed.
  componentWillUnmount() {
    this.destroyVTK();
  }

  initializeVTK() {
    if (this.vtkContainerRef.current && !this.vtkContext.initialized) {
      // Setup the main VTK render window, renderer, and OpenGL render window
      const renderWindow = vtkRenderWindow.newInstance();
      const renderer = vtkRenderer.newInstance();
      renderWindow.addRenderer(renderer);

      const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
      renderWindow.addView(openGLRenderWindow);
      openGLRenderWindow.setContainer(this.vtkContainerRef.current);

      // Adjust the size of the OpenGL render window based on the container's dimensions.
      const { width, height } =
        this.vtkContainerRef.current.getBoundingClientRect();
      openGLRenderWindow.setSize(width, height);

      // Initialize the render window interactor and bind it to the container.
      const interactor = vtkRenderWindowInteractor.newInstance();
      interactor.setView(openGLRenderWindow);
      interactor.initialize();
      interactor.setContainer(this.vtkContainerRef.current);

      // Mock data setup for demonstration (e.g., a simple 2x2 checkerboard pattern).
      const dimension = 2;
      const imageData = vtkImageData.newInstance();
      imageData.setDimensions([dimension, dimension, 1]);
      imageData.setSpacing(1.0, 1.0, 1.0);

      // Creating a 2x2 checkerboard pattern as a simple demonstration.
      const scalars = new Uint8Array([0, 255, 255, 0]);
      const dataArray = vtkDataArray.newInstance({
        name: "scalars",
        values: scalars,
        numberOfComponents: 1, // only grey scale values
      });
      imageData.getPointData().setScalars(dataArray);

      // TODO:Fix issue so the chess board gets rendered
      /** Possible sources of the issue
       * - variable imageData not correct
       * - mapper fails
       * - actor fails
       */

      // Initialize and set the mapper and actor
      /*
      const mapper = vtkImageMapper.newInstance();
      mapper.setInputData(imageData);

      const actor = vtkImageSlice.newInstance();
      actor.setMapper(mapper);
*/

      // Example setup for rendering a cone instead of the image data
      const coneSource = vtkConeSource.newInstance({ height: 1.0 });
      const mapper = vtkMapper.newInstance();
      mapper.setInputConnection(coneSource.getOutputPort());

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);

      // Adding the actor to the renderer and initiating the render process
      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();

      // Storing references to VTK objects in the context for later use
      this.vtkContext = {
        initialized: true,
        renderWindow,
        openGLRenderWindow,
        interactor,
      };
    }
  }

  // Method to clean up VTK objects and free memory
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

export default BasicImageRenderer;
