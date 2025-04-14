import React from "react";

export default function CodeCopyBtn({ code }) {
  const [copyOk, setCopyOk] = React.useState(false);

  const iconColor = copyOk ? "#0af20a" : "#ddd";
  const icon = copyOk ? "fa-check-square" : "fa-copy";

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyOk(true);
      setTimeout(() => {
        setCopyOk(false);
      }, 500);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="code-copy-btn" onClick={handleClick} aria-label="Copy code">
      <i className={`fas ${icon}`} style={{ color: iconColor }} />
    </div>
  );
}
