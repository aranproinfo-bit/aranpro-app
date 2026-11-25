import React, {useEffect, useRef, useState} from 'react';

export default function CommunityLogoField({value, onChange, onBusy}) {
  const generation = useRef(0);
  const [error, setError] = useState('');
  useEffect(() => () => { generation.current++; onBusy(false); }, [onBusy]);

  async function select(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const version = ++generation.current;
    setError('');
    onBusy(true);
    const url = URL.createObjectURL(file);
    try {
      if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error();
      const image = new Image();
      image.src = url;
      await image.decode();
      if (version !== generation.current) return;
      const ratio = Math.min(1, 320 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL('image/webp', 0.88));
    } catch {
      if (version === generation.current) setError('Selecciona una imagen PNG, JPG o WebP que se pueda abrir.');
    } finally {
      URL.revokeObjectURL(url);
      if (version === generation.current) onBusy(false);
    }
  }
  return <div className="flex flex-wrap items-center gap-4">
    {value && <img src={value} alt="Logo de la comunidad" className="h-12 w-20 object-contain"/>}
    <label className="text-sm font-semibold">Logo de la comunidad <span className="font-normal">(opcional)</span>
      <input className="block mt-1 text-xs" type="file" accept="image/png,image/jpeg,image/webp" onChange={select}/>
    </label>
    {value && <button type="button" className="text-sm underline" onClick={() => {generation.current++;onBusy(false);onChange('');setError('');}}>Quitar logo</button>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>;
}
