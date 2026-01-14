"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, Minus, User, Activity } from "lucide-react";

type BMICalculatorProps = {
  dict: any;
};

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";

export default function BMICalculator({ dict }: BMICalculatorProps) {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [idealWeight, setIdealWeight] = useState<{ min: number; max: number } | null>(null);
  const [dailyCalories, setDailyCalories] = useState<number | null>(null);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    const userAge = parseInt(age);

    if (w > 0 && h > 0 && userAge > 0) {
      const bmiValue = w / (h * h);
      setBmi(parseFloat(bmiValue.toFixed(1)));

      let adjustedBMI = bmiValue;
      if (userAge >= 65) {
        adjustedBMI = bmiValue - 1;
      }

      if (adjustedBMI < 18.5) {
        setCategory(dict.bmi?.underweight || "Pothranjenost");
      } else if (adjustedBMI >= 18.5 && adjustedBMI < 25) {
        setCategory(dict.bmi?.normal || "Normalna težina");
      } else if (adjustedBMI >= 25 && adjustedBMI < 30) {
        setCategory(dict.bmi?.overweight || "Prekomjerna težina");
      } else {
        setCategory(dict.bmi?.obese || "Gojaznost");
      }

      const minIdeal = parseFloat((18.5 * h * h).toFixed(1));
      const maxIdeal = parseFloat((25 * h * h).toFixed(1));
      setIdealWeight({ min: minIdeal, max: maxIdeal });

      let bmr: number;
      if (gender === "male") {
        bmr = 10 * w + 6.25 * parseFloat(height) - 5 * userAge + 5;
      } else {
        bmr = 10 * w + 6.25 * parseFloat(height) - 5 * userAge - 161;
      }

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
      };
      
      const calories = Math.round(bmr * activityMultipliers[activityLevel]);
      setDailyCalories(calories);
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

  const activityLevels = [
    { value: "sedentary", label: dict.bmi?.activityLevels?.sedentary || "Sedentarni - Malo ili bez vježbanja" },
    { value: "light", label: dict.bmi?.activityLevels?.light || "Lagana aktivnost - 1-3 dana/sedmica" },
    { value: "moderate", label: dict.bmi?.activityLevels?.moderate || "Umjerena aktivnost - 3-5 dana/sedmica" },
    { value: "active", label: dict.bmi?.activityLevels?.active || "Aktivni - 6-7 dana/sedmica" },
    { value: "veryActive", label: dict.bmi?.activityLevels?.veryActive || "Veoma aktivni - Dva puta dnevno" },
  ];

  return (
    <section className="relative py-20 lg:py-32 bg-black overflow-hidden">
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-full mb-6">
              <span className="text-[#ff6b35] font-semibold text-sm uppercase tracking-wider">
                {dict.bmi?.badge || "BMI Kalkulator"}
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {dict.bmi?.title || "Profesionalni BMI Kalkulator"}
            </h2>
            <p className="text-gray-400 text-lg">
              {dict.bmi?.subtitle || "Izračunaj BMI, idealnu težinu i dnevne kalorije"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 lg:p-12"
          >
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-[#ff6b35]" />
                  {dict.bmi?.enterData || "Unesi podatke"}
                </h3>

                <div className="mb-6">
                  <label className="block text-gray-400 mb-3 font-medium">
                    {dict.bmi?.gender || "Pol"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setGender("male")}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        gender === "male"
                          ? "bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {dict.bmi?.male || "Muško"}
                    </button>
                    <button
                      onClick={() => setGender("female")}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        gender === "female"
                          ? "bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {dict.bmi?.female || "Žensko"}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-400 mb-2 font-medium">
                    {dict.bmi?.age || "Godine"}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="30"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-400 mb-2 font-medium">
                    {dict.bmi?.weight || "Težina"} (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-400 mb-2 font-medium">
                    {dict.bmi?.height || "Visina"} (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-400 mb-3 font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {dict.bmi?.activityLevel || "Nivo aktivnosti"}
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-[#ff6b35] transition-colors cursor-pointer"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value} className="bg-gray-900">
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={calculateBMI}
                  disabled={!weight || !height || !age}
                  className="w-full bg-gradient-to-r from-[#ff6b35] to-red-600 hover:from-[#ff8555] hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {dict.bmi?.calculate || "Izračunaj"}
                  </div>
                </button>
              </div>

              <div className="flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {bmi !== null ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br ${getBMIColor()} mb-4 shadow-2xl`}>
                          <div className="text-center">
                            <Icon className="w-12 h-12 text-white mx-auto mb-2" />
                            <div className="text-6xl font-bold text-white">{bmi}</div>
                            <div className="text-white/80 text-sm font-medium">BMI</div>
                          </div>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">{category}</h4>
                      </div>

                      <div className="space-y-4">
                        {idealWeight && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <h5 className="text-white font-semibold">
                                {dict.bmi?.idealWeight || "Idealna težina"}
                              </h5>
                            </div>
                            <p className="text-2xl font-bold text-[#ff6b35]">
                              {idealWeight.min} - {idealWeight.max} kg
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {dict.bmi?.forYourHeight || "Za tvoju visinu"} ({height} cm)
                            </p>
                          </div>
                        )}

                        {dailyCalories && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-5 h-5 text-blue-500" />
                              <h5 className="text-white font-semibold">
                                {dict.bmi?.dailyCalories || "Dnevne kalorije"}
                              </h5>
                            </div>
                            <p className="text-2xl font-bold text-[#ff6b35]">
                              {dailyCalories} kcal
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {dict.bmi?.toMaintainWeight || "Za održavanje težine"}
                            </p>
                          </div>
                        )}

                        {idealWeight && parseFloat(weight) > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <h5 className="text-white font-semibold mb-2">
                              {dict.bmi?.analysis || "Analiza"}
                            </h5>
                            {parseFloat(weight) < idealWeight.min ? (
                              <p className="text-blue-400">
                                <span className="font-bold">{(idealWeight.min - parseFloat(weight)).toFixed(1)} kg</span> {dict.bmi?.belowIdeal || "ispod idealne težine"}
                              </p>
                            ) : parseFloat(weight) > idealWeight.max ? (
                              <p className="text-orange-400">
                                <span className="font-bold">{(parseFloat(weight) - idealWeight.max).toFixed(1)} kg</span> {dict.bmi?.aboveIdeal || "iznad idealne težine"}
                              </p>
                            ) : (
                              <p className="text-green-400">
                                <span className="font-bold">✓</span> {dict.bmi?.withinIdeal || "Unutar idealne težine"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
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
                        {dict.bmi?.enterToCalculate || "Unesi sve podatke za detaljan rezultat"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <h4 className="text-white font-semibold mb-6 text-center">
                {dict.bmi?.scale || "BMI Skala"}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium mb-1">{'< 18.5'}</div>
                  <div className="text-gray-500 text-xs">{dict.bmi?.underweight || "Pothranjenost"}</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium mb-1">18.5 - 25</div>
                  <div className="text-gray-500 text-xs">{dict.bmi?.normal || "Normalno"}</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium mb-1">25 - 30</div>
                  <div className="text-gray-500 text-xs">{dict.bmi?.overweight || "Prekomjerno"}</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 mx-auto mb-2" />
                  <div className="text-white text-sm font-medium mb-1">{'>30'}</div>
                  <div className="text-gray-500 text-xs">{dict.bmi?.obese || "Gojaznost"}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
