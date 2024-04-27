export const streamingQuadraticFundingAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "adjustWeightings",
    inputs: [
      {
        name: "_previousFlowRate",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "_newFlowRate", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allocationSuperToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ISuperToken",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "gdaPool",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecipient",
    inputs: [
      { name: "_recipientId", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct StreamingQuadraticFunding.Recipient",
        components: [
          {
            name: "recipientAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "metadata",
            type: "tuple",
            internalType: "struct StreamingQuadraticFunding.Metadata",
            components: [
              {
                name: "protocol",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "pointer",
                type: "string",
                internalType: "string",
              },
            ],
          },
          {
            name: "superApp",
            type: "address",
            internalType: "contract RecipientSuperApp",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecipientId",
    inputs: [{ name: "_superApp", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSuperApp",
    inputs: [
      { name: "_recipientId", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract RecipientSuperApp",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialSuperAppBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialize",
    inputs: [{ name: "_data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolSuperToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ISuperToken",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recipientFlowRate",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recipientSuperAppFactory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract RecipientSuperAppFactory",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recipients",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "recipientAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "metadata",
        type: "tuple",
        internalType: "struct StreamingQuadraticFunding.Metadata",
        components: [
          {
            name: "protocol",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "pointer", type: "string", internalType: "string" },
        ],
      },
      {
        name: "superApp",
        type: "address",
        internalType: "contract RecipientSuperApp",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerRecipient",
    inputs: [
      {
        name: "_recipientAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_metadata",
        type: "tuple",
        internalType: "struct StreamingQuadraticFunding.Metadata",
        components: [
          {
            name: "protocol",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "pointer", type: "string", internalType: "string" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "superApps",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "superfluidHost",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalUnitsByRecipient",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TotalUnitsUpdated",
    inputs: [
      {
        name: "recipientId",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "totalUnits",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "INVALID", inputs: [] },
  { type: "error", name: "INVALID_METADATA", inputs: [] },
  {
    type: "error",
    name: "RECIPIENT_ERROR",
    inputs: [{ name: "recipientId", type: "address", internalType: "address" }],
  },
  { type: "error", name: "UNAUTHORIZED", inputs: [] },
] as const;
