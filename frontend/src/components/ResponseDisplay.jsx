import { motion } from "framer-motion";
import { useState } from "react";
import PropTypes from "prop-types";

const ResponseDisplay = ({ response }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!response) return null;

  const predict = response.predict || {};
  const explain = response.explain || {};

  const prediction =
    explain.prediction !== undefined
      ? explain.prediction
      : predict.prediction !== undefined
        ? predict.prediction
        : "N/A";

  const probability =
    explain.probability !== undefined
      ? explain.probability
      : predict.probability !== undefined
        ? predict.probability
        : null;

  const summary = explain.summary || "No summary returned by /explain.";
  const plainEnglish = explain.plain_english || "No interpretation available.";
  const riskFactors = explain.risk_factors || [];
  const explanations = explain.explanations || [];

  const statusLabel =
    prediction === 1
      ? "Fraud Risk"
      : prediction === 0
        ? "Likely Safe"
        : "Unknown";
  const statusColor =
    prediction === 1
      ? "text-red-400"
      : prediction === 0
        ? "text-green-400"
        : "text-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 w-full bg-neutral-800 p-6 rounded-2xl shadow-xl border border-neutral-700"
    >
      <h3 className="text-2xl font-bold text-orange-400 mb-6 text-center">
        Fraud Analysis Result
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-700">
          <p className="text-sm text-neutral-400">Prediction</p>
          <p className={`text-lg font-semibold ${statusColor}`}>
            {String(prediction)} ({statusLabel})
          </p>
        </div>
        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-700">
          <p className="text-sm text-neutral-400">Probability</p>
          <p className="text-lg font-semibold text-white">
            {probability === null
              ? "N/A"
              : `${(Number(probability) * 100).toFixed(2)}%`}
          </p>
        </div>
        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-700">
          <p className="text-sm text-neutral-400">Endpoint Coverage</p>
          <p className="text-lg font-semibold text-blue-400">
            /predict + /explain
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-neutral-900 rounded-xl border border-neutral-700">
        <p className="text-sm text-neutral-400 mb-2">Summary</p>
        <p className="text-neutral-100 leading-relaxed">{summary}</p>
      </div>

      <div className="mb-6 p-4 bg-blue-900/30 rounded-xl border border-blue-700/50">
        <p className="text-sm text-blue-300 mb-2">
          Plain English Interpretation
        </p>
        <p className="text-neutral-100 leading-relaxed italic">
          {plainEnglish}
        </p>
      </div>

      {riskFactors.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-white mb-3">
            Risk Factors
          </h4>
          <div className="flex flex-wrap gap-2">
            {riskFactors.map((factor, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs bg-red-600/80 text-white"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {explanations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-white mb-3">
            Counterfactual Explanations
          </h4>
          <ul className="space-y-3">
            {explanations.map((item, idx) => (
              <li
                key={idx}
                className="p-4 bg-neutral-900 rounded-xl border border-neutral-700 text-neutral-200"
              >
                {typeof item === "string" ? (
                  item
                ) : (
                  <div>
                    <p className="font-semibold text-orange-300 mb-2">
                      Scenario {item.scenario || idx + 1}
                    </p>
                    <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
                      {(item.explanation || []).map((detail, detailIdx) => (
                        <li key={detailIdx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowRaw(!showRaw)}
        className="text-sm text-neutral-400 underline hover:text-orange-400 mt-4"
      >
        {showRaw ? "Hide Raw JSON" : "Show Raw JSON"}
      </button>

      {showRaw && (
        <pre className="mt-2 text-sm text-neutral-300 bg-neutral-900 p-3 rounded-xl overflow-x-auto">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </motion.div>
  );
};

ResponseDisplay.propTypes = {
  response: PropTypes.object.isRequired,
};

export default ResponseDisplay;
