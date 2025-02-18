import { Github } from "lucide-react";

export function ApisContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Data Indexing & APIs</h2>
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a
              href="https://docs.envio.dev/docs/HyperIndex/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              HyperIndex Framework
            </a>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/moose-code/uniswap-v4-indexer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://envio.dev/app/moose-code/uniswap-v4-indexer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors text-sm font-medium"
          >
            View Indexer →
          </a>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-medium">How to Access This Data?</h3>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50">
          <video
            src="https://screen-studio-shareable-links.67aa83ffa7fb557cd114a7156fca4e73.r2.cloudflarestorage.com/RZ78qZ7x-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=363e5c20253db1195c87384f6dfb4c99%2F20250218%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20250218T165348Z&X-Amz-Expires=7200&X-Amz-Signature=0f61dec7dfe7b33ecf0de59e881eff387c1e432fdcd27235f8b682ac05e8a291&X-Amz-SignedHeaders=host&x-id=GetObject"
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        </div>
      </div>
      <div className="prose prose-sm max-w-none prose-gray dark:prose-invert">
        <p>
          All data displayed on this dashboard is indexed in real-time using the{" "}
          <a
            href="https://docs.envio.dev/docs/HyperIndex/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            HyperIndex framework
          </a>{" "}
          and hosted on{" "}
          <a
            href="https://envio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            envio.dev
          </a>
          . This provides powerful querying capabilities through a GraphQL
          endpoint. The{" "}
          <a
            href="https://github.com/moose-code/uniswap-v4-indexer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            uniswap-v4-indexer
          </a>{" "}
          is open source, and we encourage contributions to enhance the
          available data points and querying capabilities.
        </p>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium">Flexible Deployment Options</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <h4 className="text-sm font-medium">Local Development</h4>
              <p className="text-sm text-muted-foreground">
                Run the indexer locally with{" "}
                <a
                  href="https://docs.envio.dev/docs/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  HyperIndex CLI
                </a>
                . Perfect for development, testing, and customizing data
                collection for your specific needs.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <h4 className="text-sm font-medium">Envio Hosted Service</h4>
              <p className="text-sm text-muted-foreground">
                Deploy on{" "}
                <a
                  href="https://envio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  envio.dev
                </a>{" "}
                with our generous free tier. Get your own GraphQL endpoint
                without managing infrastructure.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <h4 className="text-sm font-medium">Self-Hosted</h4>
              <p className="text-sm text-muted-foreground">
                Deploy and maintain your own instance of the indexer for
                complete control over data and infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
