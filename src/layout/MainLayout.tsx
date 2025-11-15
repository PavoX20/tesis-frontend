import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Diagrama from "@/pages/Diagram/Diagram";
import DatosPage from "@/pages/Datos/DatosPages";

const tabs = [
  { id: "diagrama", label: "Diagrama" },
  { id: "datos", label: "Datos" },
  { id: "simulacion", label: "Simulación" },
  { id: "resultados", label: "Resultados" },
];

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("diagrama");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 via-white to-blue-100 text-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white py-3 shadow-md">
        <h1 className="text-3xl font-semibold tracking-wide text-center">
          Proyecto Tesis
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center items-start py-6 px-3">
        <Card className="w-full max-w-[110rem] bg-white shadow-2xl border border-blue-100 rounded-3xl">
          <CardContent className="pt-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex flex-col items-center"
            >
              {/* Tabs */}
              <TabsList className="flex justify-center gap-6 w-full max-w-5xl mb-4 bg-gray-100 rounded-xl p-2 shadow-inner">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="text-base font-medium px-8 py-3 rounded-lg transition-all
                               data-[state=active]:bg-blue-600 data-[state=active]:text-white
                               text-gray-700 hover:text-blue-700"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Contents */}
              <div className="w-full">
                <TabsContent
                  value="diagrama"
                  className="rounded-xl bg-blue-50 p-0 min-h-[600px] shadow-inner"
                >
                  <Diagrama />
                </TabsContent>
                <TabsContent
                  value="datos"
                  className="rounded-xl bg-white p-0 min-h-[600px] shadow-inner"
                >
                  <DatosPage />
                </TabsContent>
                <TabsContent
                  value="simulacion"
                  className="rounded-xl bg-blue-50 p-0 min-h-[600px] shadow-inner"
                >
                  <p className="text-center text-gray-700 text-lg">
                    Contenido de Simulación
                  </p>
                </TabsContent>
                <TabsContent
                  value="resultados"
                  className="rounded-xl bg-blue-50 p-0 min-h-[600px] shadow-inner"
                >
                  <p className="text-center text-gray-700 text-lg">
                    Contenido de Resultados
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
