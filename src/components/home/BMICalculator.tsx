"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react";


type BMICalculatorProps = {
  dict: any;
};

export default function BMICalculator({ dict }: BMICalculatorProps) {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m

    if (w > 0 && h > 0) {
      const bmiValue = w / (h * h);
      setBmi(parseFloat(bmiValue.toFixed(1)));

      // Determine category
      if (bmiValue < 18.5) {
        setCategory(dict.bmi.underweight || "Pothranjenost");
      } else if (bmiValue >= 18.5 && bmiValue < 25) {
        setCategory(dict.bmi.normal || "Normalna težina");
      } else if (bmiValue >= 25 && bmiValue < 30) {
        setCategory(dict.bmi.overweight || "Prekomjerna težina");
      } else {
        setCategory(dict.bmi.obese || "Gojaznost");
      }
    }
  };

  const getBMIColor = () => {
    if (!bmi) return "from-gray-500 to-gray-600";
    if (bmi < 18.5) return "from-blue-500 to-cyan-500";
    if (bmi >= 18.5 && bmi < 25) return "from-green-500 to-emerald-500";
    if (bmi >= 25 && bmi < 30) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-600";
  };

  const getBMIIcon = () => {
    if (!bmi) return Calculator;
    if (bmi < 18.5) return TrendingDown;
    if (bmi >= 18.5 && bmi < 25) return Minus;
    return TrendingUp;
  };

  const Icon = getBMIIcon();

  return (
    <section className="relative py-20 lg:py-32 bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
              <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
                {dict.bmi.badge || "BMI Kalkulator"}
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {dict.bmi.title || "Izračunaj Svoj BMI"}
            </h2>
            <p className="text-gray-400 text-lg">
              {dict.bmi.subtitle || "Body Mass Index - Indeks tjelesne mase"}
            </p>
          </motion.div>

          {/* Calculator Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 lg:p-12"
          >
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left - Input */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">
                  {dict.bmi.enterData || "Unesi podatke"}
                </h3>

                {/* Weight Input */}
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2 font-medium">
                    {dict.bmi.weight || "Težina"} (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                {/* Height Input */}
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2 font-medium">
                    {dict.bmi.height || "Visina"} (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                {/* Calculate Button */}
                <button
                  onClick={calculateBMI}
                  disabled={!weight || !height}
                  className="w-full bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {dict.bmi.calculate || "Izračunaj"}
                  </div>
                </button>
              </div>

              {/* Right - Result */}
              <div className="flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {bmi !== null ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      {/* BMI Value */}
                      <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br ${getBMIColor()} mb-6 shadow-2xl`}>
                        <div className="text-center">
                          <Icon className="w-12 h-12 text-white mx-auto mb-2" />
                          <div className="text-6xl font-bold text-white">{bmi}</div>
                          <div className="text-white/80 text-sm font-medium">BMI</div>
                        </div>
                      </div>

                      {/* Category */}
                      <h4 className="text-2xl font-bold text-white mb-2">{category}</h4>
                      <p className="text-gray-400">
                        {dict.bmi.yourBMI || "Tvoj BMI indeks"}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-gray-500"
                    >
                      <Calculator className="w-24 h-24 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">
                        {dict.bmi.enterToCalculate || "Unesi podatke za izračunavanje"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* BMI Scale Reference */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h4 className="text-white font-semibold mb-4 text-center">
                {dict.bmi.scale || "BMI Skala"}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">{'< 18.5'}</div>
                  <div className="text-gray-500 text-xs">{dict.bmi.underweight || "Pothranjenost"}</div>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">18.5 - 25</div>
                  <div className="text-gray-500 text-xs">{dict.bmi.normal || "Normalno"}</div>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">25 - 30</div>
                  <div className="text-gray-500 text-xs">{dict.bmi.overweight || "Prekomjerno"}</div>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium">{'>30'}</div>
                  <div className="text-gray-500 text-xs">{dict.bmi.obese || "Gojaznost"}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
