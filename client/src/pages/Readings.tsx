export function Readings() {
  return (
    <div className="flex flex-col min-h-screen p-2 gap-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Documentation
        </h1>

        <p className="mb-2">
          Below is my best scribbling about how all of the ZK circuits within
          privatestargatefinance.eth work.
        </p>

        <iframe
          src="https://link.excalidraw.com/readonly/hUDMcjJWLvuukfVyMiJp"
          width="100%"
          height="600px"
          className="border-none"
        ></iframe>

        <h1 className="text-3xl font-bold text-left mt-8 text-gray-800">
          Still to document
        </h1>

        <p className="ml-2">- note addition/sub</p>

        <p className="ml-2">- note sharing</p>
        <p className="ml-2">- account structure</p>
        <p className="ml-2">- lz/stargate flow</p>
      </div>
    </div>
  );
}
