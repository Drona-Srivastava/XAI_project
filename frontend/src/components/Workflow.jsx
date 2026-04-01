import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import codeImg from "../assets/code.jpg";

const Workflow = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const updatedChecklist = [
    {
      title: "Ingest Transaction Features",
      description:
        "Collect amount, balance states, and encoded transaction type flags in a model-ready payload.",
    },
    {
      title: "Predict Fraud Probability",
      description:
        "Call /predict to classify transactions as fraud or non-fraud with calibrated risk probability.",
    },
    {
      title: "Generate Counterfactuals",
      description:
        "Use /explain to produce DiCE-based what-if scenarios that can flip the model decision.",
    },
    {
      title: "Deliver Human Summary",
      description:
        "Surface summary, risk factors, and explanations in plain language for analyst and stakeholder review.",
    },
  ];

  const listVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
    }),
  };

  return (
    <div ref={ref} className="mt-20">
      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-3xl sm:text-5xl lg:text-6xl text-center mt-6 tracking-wide"
      >
        End-to-end pipeline for{" "}
        <span className="bg-gradient-to-r from-orange-500 to-orange-800 text-transparent bg-clip-text">
          fraud detection + explainability
        </span>
      </motion.h2>

      <div className="flex flex-wrap justify-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="p-2 w-full lg:w-1/2"
        >
          <img src={codeImg} alt="Coding" className="rounded-2xl shadow-lg" />
        </motion.div>

        {/* Checklist */}
        <div className="pt-12 w-full lg:w-1/2">
          {updatedChecklist.map((item, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={listVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="flex mb-12"
            >
              <div className="text-green-400 mx-6 bg-neutral-900 h-10 w-10 p-2 flex justify-center items-center rounded-full shadow-md">
                <CheckCircle2 />
              </div>
              <div>
                <h5 className="mt-1 mb-2 text-xl font-semibold">
                  {item.title}
                </h5>
                <p className="text-md text-neutral-500">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workflow;
