'use client';

import { useEffect, useRef } from 'react';

interface DemoAudioGeneratorProps {
  onGenerate: (blob: Blob) => void;
}

export default function DemoAudioGenerator({ onGenerate }: DemoAudioGeneratorProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const generateDemoBeat = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    
    // Durée totale en secondes
    const duration = 4;
    
    // Créer un buffer pour stocker l'audio
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
    
    // Obtenir les canaux gauche et droit
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Générer une mélodie simple
    for (let i = 0; i < buffer.length; i++) {
      // Temps en secondes
      const time = i / ctx.sampleRate;
      
      // Fréquence de base (en Hz)
      const baseFreq = 440;
      
      // Créer un rythme simple (kick drum à 120 BPM)
      const bpm = 120;
      const beatInterval = 60 / bpm;
      const kick = Math.sin(2 * Math.PI * 60 * time) * 
                   Math.exp(-30 * (time % beatInterval));
      
      // Ajouter une mélodie simple
      const melody = Math.sin(2 * Math.PI * baseFreq * time) * 
                    Math.exp(-3 * (time % (beatInterval * 2)));
      
      // Combiner les sons avec différentes amplitudes
      const sample = kick * 0.5 + melody * 0.3;
      
      // Appliquer aux deux canaux
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    // Convertir le buffer en blob
    const offlineCtx = new OfflineAudioContext(2, buffer.length, ctx.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convertir en WAV
    const wavBlob = await new Promise<Blob>((resolve) => {
      const numberOfChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length * numberOfChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      // En-tête WAV
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, renderedBuffer.sampleRate, true);
      view.setUint32(28, renderedBuffer.sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);
      
      // Écrire les données audio
      const offset = 44;
      for (let i = 0; i < renderedBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = renderedBuffer.getChannelData(channel)[i];
          const value = Math.max(-1, Math.min(1, sample));
          view.setInt16(offset + (i * numberOfChannels + channel) * 2, value * 0x7FFF, true);
        }
      }
      
      resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
    
    onGenerate(wavBlob);
  };
  
  useEffect(() => {
    generateDemoBeat();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  return null;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
