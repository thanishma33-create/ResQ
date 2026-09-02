import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle2, RefreshCw, Send, Radio } from 'lucide-react';
import { isSpeechSupported, createSpeechRecognizer, parseVoiceTranscript } from '../../utils/speechRecognition';
import { getCurrentPosition } from '../../utils/geoUtils';
import axiosClient from '../../api/axiosClient';
import { useOffline } from '../../context/OfflineContext';

const VoiceReporter = ({ onEmergencyCreated, onCancel }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Current GPS Location');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [step, setStep] = useState('record'); // record | review | confirmed

  const recognitionRef = useRef(null);
  const { isOnline, queueEmergency } = useOffline();

  useEffect(() => {
    // Acquire GPS position immediately
    getCurrentPosition().then((pos) => {
      setLocation(pos);
      if (pos.city) setAddress(pos.city);
    });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setSpeechError(null);
    if (!isSpeechSupported()) {
      setSpeechError('Web Speech API is not supported in this browser. Please type your report.');
      return;
    }

    try {
      const recognizer = createSpeechRecognizer(
        ({ finalTranscript, interimTranscript }) => {
          if (finalTranscript) {
            setTranscript((prev) => {
              const updated = (prev ? prev + ' ' : '') + finalTranscript;
              setParsedData(parseVoiceTranscript(updated));
              return updated;
            });
          }
          setInterimTranscript(interimTranscript);
        },
        (error) => {
          console.warn('Speech recognition error:', error);
          if (error === 'not-allowed') {
            setSpeechError('Microphone access was denied. Please allow microphone access.');
          } else {
            setSpeechError(`Speech error: ${error}`);
          }
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        recognitionRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize speech recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleManualTranscriptChange = (e) => {
    const text = e.target.value;
    setTranscript(text);
    setParsedData(parseVoiceTranscript(text));
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setSpeechError('Please provide an emergency description.');
      return;
    }

    setIsSubmitting(true);
    setSpeechError(null);

    const payload = {
      transcript,
      structured_data: {
        emergency_type: parsedData?.emergency_type || 'general_evacuation',
        description: transcript,
        latitude: location?.lat !== undefined ? Number(location.lat) : null,
        longitude: location?.lon !== undefined ? Number(location.lon) : null,
        address: address || 'Reported GPS Location',
        people_affected: Number(parsedData?.people_affected || 1),
        children: Number(parsedData?.children || 0),
        elderly: Number(parsedData?.elderly || 0),
        pregnant_persons: Number(parsedData?.pregnant_persons || 0),
        disabled_persons: Number(parsedData?.disabled_persons || 0),
        injured_persons: Number(parsedData?.injured_persons || 0),
        medical_required: Boolean(parsedData?.medical_required),
        trapped: Boolean(parsedData?.trapped),
        required_resources: parsedData?.required_resources || [],
        reporter_name: reporterName || 'Voice Dispatch Citizen',
        reporter_phone: reporterPhone || '+91 99999 00000',
      },
    };

    try {
      if (isOnline) {
        const res = await axiosClient.post('/api/emergencies/voice-report', payload);
        setStep('confirmed');
        if (onEmergencyCreated) onEmergencyCreated(res.data);
      } else {
        // Queue for offline sync
        queueEmergency(payload.structured_data);
        setStep('confirmed');
        if (onEmergencyCreated) onEmergencyCreated({ id: 'QUEUED-OFFLINE', ...payload.structured_data });
      }
    } catch (err) {
      console.error('Failed to submit voice report:', err);
      setSpeechError(err.response?.data?.detail || 'Failed to submit report. Stored offline.');
      queueEmergency(payload.structured_data);
      setStep('confirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Visual Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-3 shadow-[0_0_30px_-5px_rgba(244,63,94,0.4)]">
          {isListening ? (
            <Radio className="w-8 h-8 animate-pulse text-rose-500" />
          ) : (
            <Mic className="w-8 h-8 text-rose-400" />
          )}
        </div>
        <h3 className="text-lg font-black text-slate-100">
          🎙️ Voice Emergency Dispatch
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Speak clearly: describe the situation, location, number of people trapped, or medical needs.
        </p>
      </div>

      {speechError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {step === 'record' && (
        <>
          {/* Audio Mic Button & Live Wave */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse ring-8 ring-rose-500/20 shadow-glow-danger'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-glow'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-300">
              {isListening ? 'Listening... Speak now' : 'Click microphone to record'}
            </span>

            {isListening && interimTranscript && (
              <p className="text-xs font-mono text-cyan-300 italic animate-pulse">
                "{interimTranscript}"
              </p>
            )}
          </div>

          {/* Transcript Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium text-slate-400">
              Spoken Transcript (or type manually):
            </label>
            <textarea
              rows={3}
              value={transcript}
              onChange={handleManualTranscriptChange}
              placeholder="e.g., Flood water entering our home in Kazhakkoottam. 4 people trapped on roof including one elderly and 1 injured person. Need rescue boat immediately."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* AI Extracted Structured Fields Preview */}
          {parsedData && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  AI Field Extraction
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/60">
                  Automated
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Type:</span>
                  <span className="font-bold text-slate-200 uppercase">{parsedData.emergency_type}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">People Affected:</span>
                  <span className="font-bold text-cyan-300 font-mono">{parsedData.people_affected}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Trapped Status:</span>
                  <span className={`font-bold ${parsedData.trapped ? 'text-rose-400' : 'text-slate-400'}`}>
                    {parsedData.trapped ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Medical Emergency:</span>
                  <span className={`font-bold ${parsedData.medical_required ? 'text-rose-400' : 'text-slate-400'}`}>
                    {parsedData.medical_required ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reporter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Your Name</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !transcript.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-glow-danger transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Confirm & Dispatch Report
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-glow-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-100">
            Emergency Transmitted Successfully!
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your voice report has been parsed and queued in the ResQ Command Center. Response teams are alerted.
          </p>
          <button
            type="button"
            onClick={() => {
              setTranscript('');
              setParsedData(null);
              setStep('record');
              if (onCancel) onCancel();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceReporter;
