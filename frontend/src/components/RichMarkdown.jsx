import { useEffect, useId, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

let mermaidLoader;

const loadMermaid = () => {
  if (!mermaidLoader) {
    mermaidLoader = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          background: "#ffffff",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          primaryColor: "#ccfbf1",
          primaryTextColor: "#0f2033",
          primaryBorderColor: "#0f766e",
          secondaryColor: "#dbeafe",
          secondaryTextColor: "#0f2033",
          secondaryBorderColor: "#2563eb",
          tertiaryColor: "#fef3c7",
          tertiaryTextColor: "#0f2033",
          tertiaryBorderColor: "#d97706",
          lineColor: "#64748b",
          textColor: "#0f2033",
          titleColor: "#0f2033",
          edgeLabelBackground: "#ffffff",
          clusterBkg: "#f8fafc",
          clusterBorder: "#94a3b8",
          pie1: "#14b8a6",
          pie2: "#3b82f6",
          pie3: "#f59e0b",
          pie4: "#ef4444",
          pie5: "#8b5cf6",
          pie6: "#22c55e",
          pie7: "#06b6d4",
          pie8: "#f97316",
          pie9: "#ec4899",
          pie10: "#84cc16",
          pie11: "#6366f1",
          pie12: "#eab308",
          pieSectionTextColor: "#ffffff",
          pieLegendTextColor: "#334155",
          pieTitleTextColor: "#0f2033",
          pieStrokeColor: "#ffffff",
          pieOuterStrokeColor: "#cbd5e1",
          xyChart: {
            backgroundColor: "#ffffff",
            titleColor: "#0f2033",
            xAxisLabelColor: "#334155",
            xAxisLineColor: "#64748b",
            yAxisLabelColor: "#334155",
            yAxisLineColor: "#64748b",
            plotColorPalette: "#14b8a6,#3b82f6,#f59e0b,#ef4444,#8b5cf6,#22c55e,#06b6d4,#f97316",
          },
        },
        suppressErrorRendering: true,
        flowchart: { htmlLabels: false, curve: "basis" },
      });
      return mermaid;
    });
  }
  return mermaidLoader;
};

const normalizeMermaidSource = (source = "") => source
  // A common LLM typo adds a second arrow head after an edge label:
  // A -->|label|> B. Mermaid expects A -->|label| B.
  .replace(/-->\|([^|\n]+)\|>\s*/g, "-->|$1| ")
  .trim();

function MermaidDiagram({ source }) {
  const reactId = useId();
  const diagramId = useMemo(() => `vidyaai-diagram-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [reactId]);
  const [state, setState] = useState({ status: "loading", svg: "" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", svg: "" });

    const normalizedSource = normalizeMermaidSource(source);
    loadMermaid()
      .then((mermaid) => mermaid.render(diagramId, normalizedSource))
      .then(({ svg }) => {
        if (active) setState({ status: "ready", svg });
      })
      .catch(() => {
        if (active) setState({ status: "error", svg: "" });
      });

    return () => {
      active = false;
    };
  }, [diagramId, source]);

  if (state.status === "loading") {
    return <div className="response-visual-status">Preparing diagram…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="response-visual-fallback">
        <strong>Diagram preview unavailable</strong>
        <pre><code>{source}</code></pre>
      </div>
    );
  }
  return (
    <div
      className="response-mermaid"
      role="img"
      aria-label="Educational diagram"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}

const parseList = (value = "") => value.split(";").map((item) => item.trim()).filter(Boolean);

function VennDiagram({ source }) {
  const values = useMemo(() => {
    const parsed = {};
    source.split("\n").forEach((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return;
      const key = line.slice(0, separator).trim().toLowerCase();
      parsed[key] = line.slice(separator + 1).trim();
    });
    return parsed;
  }, [source]);

  if (!values.left || !values.right) {
    return (
      <div className="response-visual-fallback">
        <strong>Venn diagram preview unavailable</strong>
        <pre><code>{source}</code></pre>
      </div>
    );
  }

  return (
    <figure className="response-venn" aria-label={`Venn diagram comparing ${values.left} and ${values.right}`}>
      {values.title && <figcaption>{values.title}</figcaption>}
      <div className="response-venn-canvas">
        <div className="response-venn-circle left">
          <strong>{values.left}</strong>
          <span>{parseList(values.leftitems).join(" • ")}</span>
        </div>
        <div className="response-venn-circle right">
          <strong>{values.right}</strong>
          <span>{parseList(values.rightitems).join(" • ")}</span>
        </div>
        <div className="response-venn-shared">
          <strong>{values.sharedlabel || "Both"}</strong>
          <span>{parseList(values.shareditems).join(" • ")}</span>
        </div>
      </div>
    </figure>
  );
}

function MarkdownCode({ className = "", children, streaming, node: _node, ...props }) {
  const language = className.match(/language-([\w-]+)/)?.[1]?.toLowerCase();
  const source = String(children || "").replace(/\n$/, "");

  if (language === "mermaid") {
    return streaming
      ? <div className="response-visual-status">Preparing diagram…</div>
      : <MermaidDiagram source={source} />;
  }
  if (language === "venn") {
    return streaming
      ? <div className="response-visual-status">Preparing Venn diagram…</div>
      : <VennDiagram source={source} />;
  }
  return <code className={className} {...props}>{children}</code>;
}

export default function RichMarkdown({ children, streaming = false }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: (props) => <MarkdownCode {...props} streaming={streaming} />,
        table: ({ children: tableChildren }) => (
          <div className="response-table-wrap"><table>{tableChildren}</table></div>
        ),
      }}
    >
      {children || ""}
    </ReactMarkdown>
  );
}
