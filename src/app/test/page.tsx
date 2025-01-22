"use client";
import { useState } from "react";
import QRCode from "qrcode";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function Page() {
  const [inputString, setInputString] = useState<string>("");
  const [qr, setQr] = useState("");

  const [qrResult, setQrResult] = useState("");

  const GenerateQRCode = () => {
    QRCode.toDataURL(
      inputString,
      {
        width: 800,
        margin: 2,
        color: {
          dark: "#a3a3a3",
          light: "#171717",
        },
      },
      (err, url) => {
        if (err) return console.error(err);

        console.log(url);
        setQr(url);
      },
    );
  };

  return (
    <div>
      <div className="text-3xl">QR Code Generator: <b>{qrResult}</b></div>
      <Scanner onScan={(result) => console.log(result)} />;
      <input
        type="text"
        value={inputString}
        onChange={(e) => setInputString(e.target.value)}
      />
      <button onClick={GenerateQRCode}>Generate</button>
      {qr.length > 0 && <img src={qr} />}
    </div>
  );
}
