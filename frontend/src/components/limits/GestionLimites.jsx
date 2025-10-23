import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  TrendingUp,
  Target,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import CalendarioLimites from "../calendar/CalendarioLimites";

function GestionLimites({ hijoId, nombreHijo }) {
  const [limites, setLimites] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [limiteEditando, setLimiteEditando] = useState(null);
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [nuevoLimite, setNuevoLimite] = useState({
    tipo: "diario",
    monto: "",
    categoria: "general",
    fechaInicio: "",
    fechaFin: "",
    descripcion: "",
  });

  const tiposLimite = [
    { value: "diario", label: "Diario", icon: "📅" },
    { value: "semanal", label: "Semanal", icon: "📊" },
    { value: "mensual", label: "Mensual", icon: "🗓️" },
    { value: "personalizado", label: "Personalizado", icon: "⚙️" },
  ];

  const categorias = [
    { value: "general", label: "General", icon: "💰", color: "bg-gray-100" },
    {
      value: "alimentacion",
      label: "Alimentación",
      icon: "🍔",
      color: "bg-orange-100",
    },
    {
      value: "educacion",
      label: "Educación",
      icon: "📚",
      color: "bg-blue-100",
    },
    {
      value: "entretenimiento",
      label: "Entretenimiento",
      icon: "🎮",
      color: "bg-purple-100",
    },
    { value: "deportes", label: "Deportes", icon: "⚽", color: "bg-green-100" },
    {
      value: "tecnologia",
      label: "Tecnología",
      icon: "💻",
      color: "bg-indigo-100",
    },
    { value: "ropa", label: "Ropa", icon: "👕", color: "bg-pink-100" },
    {
      value: "transporte",
      label: "Transporte",
      icon: "🚌",
      color: "bg-yellow-100",
    },
  ];

  useEffect(() => {
    cargarLimites();
  }, [hijoId]);

  const cargarLimites = async () => {
    try {
      setCargando(true);
      console.log("🔄 Cargando límites para hijo:", hijoId);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/limits/list/${hijoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Límites cargados:", data);

        if (data.success && Array.isArray(data.limits)) {
          // Convertir las fechas y formatear los datos
          const limitesFormateados = data.limits.map((limite) => ({
            id: limite._id,
            tipo: limite.tipo,
            monto: limite.monto,
            gastado: limite.gastado || 0,
            categoria: limite.categoria,
            fechaInicio: limite.fechaInicio.split("T")[0],
            fechaFin: limite.fechaFin.split("T")[0],
            descripcion: limite.descripcion || "",
            activo: limite.activo,
          }));

          setLimites(limitesFormateados);
        } else {
          setLimites([]);
        }
      } else {
        console.log("⚠️ No se encontraron límites, iniciando con array vacío");
        setLimites([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar límites:", error);
      setLimites([]);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarLimite = async (e) => {
    e.preventDefault();

    if (
      !nuevoLimite.monto ||
      !nuevoLimite.fechaInicio ||
      !nuevoLimite.fechaFin
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const limitData = {
        tipo: nuevoLimite.tipo,
        monto: parseFloat(nuevoLimite.monto),
        categoria: nuevoLimite.categoria,
        fechaInicio: nuevoLimite.fechaInicio,
        fechaFin: nuevoLimite.fechaFin,
        descripcion: nuevoLimite.descripcion || "",
      };

      console.log("📤 Enviando límite:", limitData);

      const url = limiteEditando
        ? `${import.meta.env.VITE_API_URL}/limits/update/${limiteEditando.id}`
        : `${import.meta.env.VITE_API_URL}/limits/create/${hijoId}`;

      const method = limiteEditando ? "PUT" : "POST";

      console.log("📤 URL:", url);
      console.log("📤 Method:", method);
      console.log("📤 Headers:", {
        "Content-Type": "application/json",
        Authorization: token ? "Bearer [TOKEN]" : "No token",
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(limitData),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);

      const data = await response.json();
      console.log("📥 Respuesta del servidor:", data);

      if (response.ok && data.success) {
        toast.success(
          limiteEditando
            ? "Límite actualizado exitosamente"
            : "Límite creado exitosamente"
        );
        setMostrarModal(false);
        setLimiteEditando(null);
        setNuevoLimite({
          tipo: "diario",
          monto: "",
          categoria: "general",
          fechaInicio: "",
          fechaFin: "",
          descripcion: "",
        });
        // Recargar límites
        cargarLimites();
      } else {
        console.error("❌ Error en respuesta:", data);
        toast.error(data.message || "Error al guardar el límite");
      }
    } catch (error) {
      console.error("❌ Error al guardar límite:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const editarLimite = (limite) => {
    setLimiteEditando(limite);
    setNuevoLimite({
      tipo: limite.tipo,
      monto: limite.monto.toString(),
      categoria: limite.categoria,
      fechaInicio: limite.fechaInicio,
      fechaFin: limite.fechaFin,
      descripcion: limite.descripcion || "",
    });
    setMostrarModal(true);
  };

  const eliminarLimite = async (limiteId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este límite?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/limits/delete/${limiteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Límite eliminado exitosamente");
        cargarLimites();
      } else {
        toast.error(data.message || "Error al eliminar el límite");
      }
    } catch (error) {
      console.error("Error al eliminar límite:", error);
      toast.error("Error al eliminar el límite");
    }
  };

  const toggleActivoLimite = async (limiteId) => {
    try {
      const limite = limites.find((l) => l.id === limiteId);
      if (!limite) return;

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/limits/update/${limiteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activo: !limite.activo,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Estado del límite actualizado");
        cargarLimites();
      } else {
        toast.error(data.message || "Error al cambiar el estado");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar el estado del límite");
    }
  };

  const calcularPorcentajeGastado = (gastado, limite) => {
    return Math.min((gastado / limite) * 100, 100);
  };

  const obtenerColorPorcentaje = (porcentaje) => {
    if (porcentaje >= 90) return "bg-red-500";
    if (porcentaje >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const obtenerCategoriaInfo = (categoria) => {
    return categorias.find((c) => c.value === categoria) || categorias[0];
  };

  const calcularFechaFin = (tipo, fechaInicio) => {
    const fecha = new Date(fechaInicio);
    switch (tipo) {
      case "diario":
        return fechaInicio;
      case "semanal":
        fecha.setDate(fecha.getDate() + 7);
        return fecha.toISOString().split("T")[0];
      case "mensual":
        fecha.setMonth(fecha.getMonth() + 1);
        return fecha.toISOString().split("T")[0];
      default:
        return "";
    }
  };

  useEffect(() => {
    if (nuevoLimite.tipo !== "personalizado" && nuevoLimite.fechaInicio) {
      setNuevoLimite((prev) => ({
        ...prev,
        fechaFin: calcularFechaFin(prev.tipo, prev.fechaInicio),
      }));
    }
  }, [nuevoLimite.tipo, nuevoLimite.fechaInicio]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Límites</h2>
          <p className="text-gray-600">
            Administra los límites de gasto para {nombreHijo}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setVistaCalendario(!vistaCalendario)}
            className="btn-outline flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>{vistaCalendario ? "Ver Lista" : "Ver Calendario"}</span>
          </button>
          <button
            onClick={() => setMostrarModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Límite</span>
          </button>
        </div>
      </div>

      {/* Resumen de límites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-600">Límites Activos</h3>
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {Array.isArray(limites)
              ? limites.filter((l) => l.activo).length
              : 0}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-600">Gasto Total Hoy</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            $
            {Array.isArray(limites)
              ? limites
                  .reduce(
                    (total, l) => total + (l.tipo === "diario" ? l.gastado : 0),
                    0
                  )
                  .toFixed(2)
              : "0.00"}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-600">Alertas</h3>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {Array.isArray(limites)
              ? limites.filter(
                  (l) => calcularPorcentajeGastado(l.gastado, l.monto) >= 80
                ).length
              : 0}
          </p>
        </div>
      </div>

      {/* Vista de Calendario o Lista */}
      {vistaCalendario ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <CalendarioLimites
            hijoId={hijoId}
            onLimiteChange={(limites) => {
              console.log("📅 Límites actualizados desde calendario:", limites);
              cargarLimites();
            }}
          />
        </div>
      ) : (
        <>
          {/* Lista de límites */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Límites Configurados</h3>
            </div>

            {cargando ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando límites...</p>
              </div>
            ) : Array.isArray(limites) && limites.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {limites.map((limite, index) => {
                  const categoriaInfo = obtenerCategoriaInfo(limite.categoria);
                  const porcentajeGastado = calcularPorcentajeGastado(
                    limite.gastado,
                    limite.monto
                  );

                  return (
                    <motion.div
                      key={limite.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-lg ${categoriaInfo.color} flex items-center justify-center text-xl`}
                          >
                            {categoriaInfo.icon}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold capitalize">
                                {limite.tipo}
                              </h4>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500 capitalize">
                                {categoriaInfo.label}
                              </span>
                              {!limite.activo && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {limite.descripcion}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>
                                Desde:{" "}
                                {new Date(
                                  limite.fechaInicio
                                ).toLocaleDateString()}
                              </span>
                              <span>
                                Hasta:{" "}
                                {new Date(limite.fechaFin).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              ${limite.gastado.toFixed(2)} / $
                              {limite.monto.toFixed(2)}
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full transition-all ${obtenerColorPorcentaje(
                                  porcentajeGastado
                                )}`}
                                style={{ width: `${porcentajeGastado}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {porcentajeGastado.toFixed(1)}% usado
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleActivoLimite(limite.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                limite.activo
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-50"
                              }`}
                              title={limite.activo ? "Desactivar" : "Activar"}
                            >
                              <Settings className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => editarLimite(limite)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => eliminarLimite(limite.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No hay límites configurados
                </h3>
                <p className="text-gray-500 mb-4">
                  Crea el primer límite de gasto para {nombreHijo}
                </p>
                <button
                  onClick={() => setMostrarModal(true)}
                  className="btn-primary"
                >
                  Crear Primer Límite
                </button>
              </div>
            )}
          </div>

          {/* Modal para crear/editar límite */}
          {mostrarModal && (
            <div className="modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    {limiteEditando ? "Editar Límite" : "Nuevo Límite"}
                  </h3>
                  <button
                    onClick={() => {
                      setMostrarModal(false);
                      setLimiteEditando(null);
                      setNuevoLimite({
                        tipo: "diario",
                        monto: "",
                        categoria: "general",
                        fechaInicio: "",
                        fechaFin: "",
                        descripcion: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleGuardarLimite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Límite
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {tiposLimite.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() =>
                            setNuevoLimite((prev) => ({
                              ...prev,
                              tipo: tipo.value,
                            }))
                          }
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                            nuevoLimite.tipo === tipo.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-lg mb-1">{tipo.icon}</div>
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={nuevoLimite.categoria}
                      onChange={(e) =>
                        setNuevoLimite((prev) => ({
                          ...prev,
                          categoria: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria.value} value={categoria.value}>
                          {categoria.icon} {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Límite
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={nuevoLimite.monto}
                      onChange={(e) =>
                        setNuevoLimite((prev) => ({
                          ...prev,
                          monto: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={nuevoLimite.fechaInicio}
                        onChange={(e) =>
                          setNuevoLimite((prev) => ({
                            ...prev,
                            fechaInicio: e.target.value,
                          }))
                        }
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={nuevoLimite.fechaFin}
                        onChange={(e) =>
                          setNuevoLimite((prev) => ({
                            ...prev,
                            fechaFin: e.target.value,
                          }))
                        }
                        className="input-field"
                        disabled={nuevoLimite.tipo !== "personalizado"}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <textarea
                      placeholder="Descripción del límite..."
                      value={nuevoLimite.descripcion}
                      onChange={(e) =>
                        setNuevoLimite((prev) => ({
                          ...prev,
                          descripcion: e.target.value,
                        }))
                      }
                      className="input-field"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarModal(false);
                        setLimiteEditando(null);
                      }}
                      className="btn-outline flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{limiteEditando ? "Actualizar" : "Crear"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GestionLimites;
