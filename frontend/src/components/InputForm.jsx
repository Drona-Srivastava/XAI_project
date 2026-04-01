import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import ResponseDisplay from "./ResponseDisplay";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const initialFormState = {
  amount: "",
  oldbalanceOrg: "",
  newbalanceOrig: "",
  oldbalanceDest: "",
  newbalanceDest: "",
  type_TRANSFER: "0",
  type_CASH_OUT: "0",
  type_DEBIT: "0",
  type_PAYMENT: "0",
};

const numericFields = [
  "amount",
  "oldbalanceOrg",
  "newbalanceOrig",
  "oldbalanceDest",
  "newbalanceDest",
];

const typeFields = [
  "type_TRANSFER",
  "type_CASH_OUT",
  "type_DEBIT",
  "type_PAYMENT",
];

const fieldLabels = {
  amount: "Amount",
  oldbalanceOrg: "Old Original Balance",
  newbalanceOrig: "New Original Balance",
  oldbalanceDest: "Old Destination Balance",
  newbalanceDest: "New Destination Balance",
  type_TRANSFER: "Transaction Type: Transfer",
  type_CASH_OUT: "Transaction Type: Cash Out",
  type_DEBIT: "Transaction Type: Debit",
  type_PAYMENT: "Transaction Type: Payment",
};

const InputForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
    }),
  };

  const buildPayload = () => {
    const payload = {};

    numericFields.forEach((field) => {
      payload[field] = Number(formData[field] || 0);
    });

    typeFields.forEach((field) => {
      payload[field] = Number(formData[field] || 0);
    });

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSubmitted(false);
    setResponseData(null);

    try {
      const payload = buildPayload();

      const [predictResponse, explainResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(`${API_BASE_URL}/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      if (!predictResponse.ok || !explainResponse.ok) {
        throw new Error("Failed to fetch prediction or explanation response");
      }

      const predict = await predictResponse.json();
      const explain = await explainResponse.json();

      setResponseData({ predict, explain, payload });
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      setError(
        "Could not connect to the fraud API. Check endpoint availability and request payload.",
      );
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="relative mt-20 border-b border-neutral-800 min-h-[600px] flex flex-col justify-center items-center px-4"
    >
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-4xl sm:text-5xl font-bold text-center mb-12"
      >
        <span className="bg-gradient-to-r from-orange-500 to-red-700 text-transparent bg-clip-text">
          Analyze a Transaction
        </span>
      </motion.h1>

      <motion.form
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-neutral-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-neutral-800"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-3xl sm:text-4xl text-center font-semibold mb-10"
        >
          <span className="bg-gradient-to-r from-orange-500 to-orange-800 text-transparent bg-clip-text">
            Fraud Inputs + Explainability
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {numericFields.map((field, index) => (
            <motion.div
              key={field}
              custom={index}
              variants={inputVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <label
                htmlFor={field}
                className="block mb-2 text-sm font-medium text-neutral-400"
              >
                {fieldLabels[field]}
              </label>
              <input
                id={field}
                name={field}
                type="number"
                step="any"
                value={formData[field]}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0"
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {typeFields.map((field, index) => (
            <motion.div
              key={field}
              custom={index + numericFields.length}
              variants={inputVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <label
                htmlFor={field}
                className="block mb-2 text-sm font-medium text-neutral-400"
              >
                {fieldLabels[field]}
              </label>
              <select
                id={field}
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-neutral-400 mb-6">
          Tip: If a transaction type does not apply, keep it at 0.
        </p>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-2xl font-semibold text-lg transform transition duration-300 shadow-md ${
            loading
              ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-orange-800 text-white hover:scale-105 hover:shadow-lg"
          }`}
        >
          {loading ? "Calling /predict and /explain..." : "Run Fraud Analysis"}
        </button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center text-red-400 font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.form>

      {submitted && responseData && <ResponseDisplay response={responseData} />}
    </div>
  );
};

export default InputForm;
