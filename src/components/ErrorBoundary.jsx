import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // You can log to an error service here
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white shadow rounded-2xl p-6">
            <h1 className="text-xl font-semibold mb-2">Algo salió mal</h1>
            <p className="text-sm text-gray-600 mb-4">
              Si esto ocurrió tras el último despliegue, actualiza la página. Si persiste,
              revisa las variables de entorno y que el dataset esté disponible.
            </p>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
