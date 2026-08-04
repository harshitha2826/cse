import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../../utils/confetti';
import { Award, CheckCircle2, Download, Printer, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';

export interface CertificateData {
  learnerName: string;
  teacherName: string;
  skillTitle: string;
  completedDate: string;
  certId: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, data }) => {
  useEffect(() => {
    if (isOpen && data) {
      triggerConfetti();
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://cse-frontend-two.vercel.app/dashboard?cert=${data.certId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="w-full max-w-3xl bg-zinc-950 text-white border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 print:border-none print:shadow-none print:bg-white print:text-black"
        >
          {/* Modal Header Bar (Hidden during print) */}
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Official Verified Skill Certificate
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Download PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 📜 Certificate Canvas Card */}
          <div id="certificate-print-area" className="p-8 sm:p-12 relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-8 border-double border-emerald-500/30 m-4 rounded-2xl">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Zap className="w-96 h-96 text-emerald-400" />
            </div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />

            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> SkillBridge Certified Mastery
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Certificate of Completion
              </h1>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                This is to officially certify that
              </p>
            </div>

            {/* Recipient Name */}
            <div className="text-center my-6 py-2 border-b-2 border-emerald-500/30 max-w-lg mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {data.learnerName}
              </h2>
            </div>

            {/* Statement */}
            <div className="text-center max-w-xl mx-auto space-y-2 text-sm text-zinc-300 leading-relaxed">
              <p>
                has successfully completed all requirements, 100% learning roadmap milestones, and teacher evaluation for:
              </p>
              <p className="text-xl font-bold text-white py-1">
                "{data.skillTitle}"
              </p>
              <p className="text-xs text-zinc-400">
                demonstrating verified proficiency and practical mastery through community skill exchange.
              </p>
            </div>

            {/* Certificate Footer with Signatures & QR Code */}
            <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Teacher Signature */}
              <div className="text-center sm:text-left space-y-1">
                <div className="font-serif italic text-lg text-emerald-400 border-b border-zinc-700 pb-1 px-2">
                  {data.teacherName}
                </div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Verified Instructor / Mentor
                </p>
              </div>

              {/* Scannable Verification QR Code */}
              <div className="flex items-center gap-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800">
                <img
                  src={qrUrl}
                  alt="Scannable QR Verification Code"
                  className="w-16 h-16 rounded-lg border border-zinc-700 bg-white p-1"
                />
                <div className="text-left space-y-0.5">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                    ✓ Verified Hash
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300 block">
                    {data.certId}
                  </span>
                  <span className="text-[9px] text-zinc-500 block">
                    Issued: {data.completedDate}
                  </span>
                </div>
              </div>

              {/* SkillBridge Platform Seal */}
              <div className="text-center sm:text-right space-y-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 mx-auto sm:ml-auto flex items-center justify-center text-black font-black text-xs shadow-md">
                  <Award className="w-5 h-5 text-black" />
                </div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  SkillBridge Authorized
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
