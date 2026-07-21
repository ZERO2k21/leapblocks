export const GENERATED_COMPONENT_METADATA: Record<string, {
  events: Array<{ name: string; parameters: Array<{ name: string; type: string }> }>;
  methods: Array<{ name: string; parameters: Array<{ name: string; type: string }> }>;
  properties: Array<{ name: string; type: string }>;
}> = {
  "AbsoluteArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "AccelerometerSensor": {
    "events": [
      {
        "name": "AccelerationChanged",
        "parameters": [
          {
            "name": "xAccel",
            "type": "Number"
          },
          {
            "name": "yAccel",
            "type": "Number"
          },
          {
            "name": "zAccel",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Shaking",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "LegacyMode",
        "type": "Any"
      },
      {
        "name": "MinimumInterval",
        "type": "Any"
      },
      {
        "name": "Sensitivity",
        "type": "Any"
      },
      {
        "name": "SensitivityAbstract",
        "type": "Any"
      },
      {
        "name": "XAccel",
        "type": "Any"
      },
      {
        "name": "YAccel",
        "type": "Any"
      },
      {
        "name": "ZAccel",
        "type": "Any"
      }
    ]
  },
  "ActivityStarter": {
    "events": [
      {
        "name": "ActivityCanceled",
        "parameters": []
      },
      {
        "name": "ActivityError",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "AfterActivity",
        "parameters": [
          {
            "name": "result",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "ResolveActivity",
        "parameters": []
      },
      {
        "name": "StartActivity",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Action",
        "type": "Any"
      },
      {
        "name": "ActivityClass",
        "type": "Any"
      },
      {
        "name": "ActivityPackage",
        "type": "Any"
      },
      {
        "name": "DataType",
        "type": "Any"
      },
      {
        "name": "DataUri",
        "type": "Any"
      },
      {
        "name": "ExtraKey",
        "type": "Any"
      },
      {
        "name": "ExtraValue",
        "type": "Any"
      },
      {
        "name": "Extras",
        "type": "Any"
      },
      {
        "name": "Result",
        "type": "Any"
      },
      {
        "name": "ResultName",
        "type": "Any"
      },
      {
        "name": "ResultType",
        "type": "Any"
      },
      {
        "name": "ResultUri",
        "type": "Any"
      }
    ]
  },
  "AnomalyDetection": {
    "events": [],
    "methods": [
      {
        "name": "ElementsFromPairs",
        "parameters": [
          {
            "name": "elements",
            "type": "String"
          }
        ]
      }
    ],
    "properties": []
  },
  "Ball": {
    "events": [],
    "methods": [
      {
        "name": "MoveTo",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "OriginAtCenter",
        "type": "Any"
      },
      {
        "name": "PaintColor",
        "type": "Any"
      },
      {
        "name": "Radius",
        "type": "Any"
      },
      {
        "name": "X",
        "type": "Any"
      },
      {
        "name": "Y",
        "type": "Any"
      }
    ]
  },
  "BarcodeScanner": {
    "events": [
      {
        "name": "AfterScan",
        "parameters": [
          {
            "name": "result",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "DoScan",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Result",
        "type": "Any"
      },
      {
        "name": "UseExternalScanner",
        "type": "Any"
      }
    ]
  },
  "Barometer": {
    "events": [
      {
        "name": "AirPressureChanged",
        "parameters": [
          {
            "name": "pressure",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "AirPressure",
        "type": "Any"
      }
    ]
  },
  "BluetoothClient": {
    "events": [],
    "methods": [
      {
        "name": "Connect",
        "parameters": [
          {
            "name": "address",
            "type": "String"
          }
        ]
      },
      {
        "name": "ConnectWithUUID",
        "parameters": [
          {
            "name": "address",
            "type": "String"
          },
          {
            "name": "uuid",
            "type": "String"
          }
        ]
      },
      {
        "name": "IsDevicePaired",
        "parameters": [
          {
            "name": "address",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "AddressesAndNames",
        "type": "Any"
      },
      {
        "name": "DisconnectOnError",
        "type": "Any"
      },
      {
        "name": "NoLocationNeeded",
        "type": "Any"
      },
      {
        "name": "PollingRate",
        "type": "Any"
      }
    ]
  },
  "BluetoothConnectionBase": {
    "events": [
      {
        "name": "BluetoothError",
        "parameters": [
          {
            "name": "functionName",
            "type": "String"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Disconnect",
        "parameters": []
      },
      {
        "name": "BytesAvailableToReceive",
        "parameters": []
      },
      {
        "name": "ReceiveSigned1ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveSigned2ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveSigned4ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveSignedBytes",
        "parameters": [
          {
            "name": "numberOfBytes",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReceiveText",
        "parameters": [
          {
            "name": "numberOfBytes",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReceiveUnsigned1ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveUnsigned2ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveUnsigned4ByteNumber",
        "parameters": []
      },
      {
        "name": "ReceiveUnsignedBytes",
        "parameters": [
          {
            "name": "numberOfBytes",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Send1ByteNumber",
        "parameters": [
          {
            "name": "number",
            "type": "String"
          }
        ]
      },
      {
        "name": "Send2ByteNumber",
        "parameters": [
          {
            "name": "number",
            "type": "String"
          }
        ]
      },
      {
        "name": "Send4ByteNumber",
        "parameters": [
          {
            "name": "number",
            "type": "String"
          }
        ]
      },
      {
        "name": "SendBytes",
        "parameters": [
          {
            "name": "list",
            "type": "List"
          }
        ]
      },
      {
        "name": "SendText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "CharacterEncoding",
        "type": "Any"
      },
      {
        "name": "DelimiterByte",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "HighByteFirst",
        "type": "Any"
      },
      {
        "name": "IsConnected",
        "type": "Any"
      },
      {
        "name": "Secure",
        "type": "Any"
      }
    ]
  },
  "BluetoothServer": {
    "events": [
      {
        "name": "ConnectionAccepted",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "AcceptConnection",
        "parameters": [
          {
            "name": "serviceName",
            "type": "String"
          }
        ]
      },
      {
        "name": "AcceptConnectionWithUUID",
        "parameters": [
          {
            "name": "serviceName",
            "type": "String"
          },
          {
            "name": "uuid",
            "type": "String"
          }
        ]
      },
      {
        "name": "StopAccepting",
        "parameters": []
      }
    ],
    "properties": []
  },
  "Button": {
    "events": [
      {
        "name": "Click",
        "parameters": []
      },
      {
        "name": "LongClick",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": []
  },
  "ButtonBase": {
    "events": [
      {
        "name": "GotFocus",
        "parameters": []
      },
      {
        "name": "LostFocus",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Shape",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      }
    ]
  },
  "Camcorder": {
    "events": [
      {
        "name": "AfterRecording",
        "parameters": [
          {
            "name": "clip",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "RecordVideo",
        "parameters": []
      }
    ],
    "properties": []
  },
  "Camera": {
    "events": [
      {
        "name": "AfterPicture",
        "parameters": [
          {
            "name": "image",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "TakePicture",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "UseFront",
        "type": "Any"
      }
    ]
  },
  "Canvas": {
    "events": [
      {
        "name": "TouchDown",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Touched",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "touchedAnySprite",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "TouchUp",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Clear",
        "parameters": []
      },
      {
        "name": "DrawCircle",
        "parameters": [
          {
            "name": "centerX",
            "type": "Number"
          },
          {
            "name": "centerY",
            "type": "Number"
          },
          {
            "name": "radius",
            "type": "Number"
          },
          {
            "name": "fill",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "DrawLine",
        "parameters": [
          {
            "name": "x1",
            "type": "Number"
          },
          {
            "name": "y1",
            "type": "Number"
          },
          {
            "name": "x2",
            "type": "Number"
          },
          {
            "name": "y2",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawPoint",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawShape",
        "parameters": [
          {
            "name": "pointList",
            "type": "List"
          },
          {
            "name": "fill",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "DrawText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawTextAtAngle",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "angle",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetBackgroundPixelColor",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetPixelColor",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Save",
        "parameters": []
      },
      {
        "name": "SaveAs",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetBackgroundPixelColor",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "color",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "BackgroundImage",
        "type": "Any"
      },
      {
        "name": "BackgroundImageinBase64",
        "type": "Any"
      },
      {
        "name": "ExtendMovesOutsideCanvas",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "LineWidth",
        "type": "Any"
      },
      {
        "name": "PaintColor",
        "type": "Any"
      },
      {
        "name": "TapThreshold",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "Chart": {
    "events": [
      {
        "name": "EntryClick",
        "parameters": [
          {
            "name": "series",
            "type": "Any"
          },
          {
            "name": "x",
            "type": "Any"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "ExtendDomainToInclude",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ExtendRangeToInclude",
        "parameters": [
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ResetAxes",
        "parameters": []
      },
      {
        "name": "SetDomain",
        "parameters": [
          {
            "name": "minimum",
            "type": "Number"
          },
          {
            "name": "maximum",
            "type": "Number"
          }
        ]
      },
      {
        "name": "SetRange",
        "parameters": [
          {
            "name": "minimum",
            "type": "Number"
          },
          {
            "name": "maximum",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "AxesTextColor",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Description",
        "type": "Any"
      },
      {
        "name": "GridEnabled",
        "type": "Any"
      },
      {
        "name": "Labels",
        "type": "Any"
      },
      {
        "name": "LabelsFromString",
        "type": "Any"
      },
      {
        "name": "LegendEnabled",
        "type": "Any"
      },
      {
        "name": "PieRadius",
        "type": "Any"
      },
      {
        "name": "Type",
        "type": "Any"
      },
      {
        "name": "ValueFormat",
        "type": "Any"
      },
      {
        "name": "XFromZero",
        "type": "Any"
      },
      {
        "name": "YFromZero",
        "type": "Any"
      }
    ]
  },
  "ChartData2D": {
    "events": [],
    "methods": [
      {
        "name": "AddEntry",
        "parameters": [
          {
            "name": "x",
            "type": "Any"
          },
          {
            "name": "y",
            "type": "Any"
          }
        ]
      },
      {
        "name": "DoesEntryExist",
        "parameters": [
          {
            "name": "x",
            "type": "Any"
          },
          {
            "name": "y",
            "type": "Any"
          }
        ]
      },
      {
        "name": "DrawLineOfBestFit",
        "parameters": [
          {
            "name": "xList",
            "type": "Any"
          },
          {
            "name": "yList",
            "type": "Any"
          }
        ]
      },
      {
        "name": "HighlightDataPoints",
        "parameters": [
          {
            "name": "dataPoints",
            "type": "Any"
          },
          {
            "name": "color",
            "type": "Number"
          }
        ]
      },
      {
        "name": "RemoveEntry",
        "parameters": [
          {
            "name": "x",
            "type": "Any"
          },
          {
            "name": "y",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": []
  },
  "ChartDataBase": {
    "events": [
      {
        "name": "EntryClick",
        "parameters": [
          {
            "name": "x",
            "type": "Any"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Color",
        "type": "Any"
      },
      {
        "name": "Colors",
        "type": "Any"
      },
      {
        "name": "DataLabelColor",
        "type": "Any"
      },
      {
        "name": "Label",
        "type": "Any"
      },
      {
        "name": "LineType",
        "type": "Any"
      },
      {
        "name": "PointShape",
        "type": "Any"
      }
    ]
  },
  "ChatBot": {
    "events": [
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "responseCode",
            "type": "Any"
          },
          {
            "name": "responseText",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotResponse",
        "parameters": [
          {
            "name": "responseText",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotResponseWithImage",
        "parameters": [
          {
            "name": "responseText",
            "type": "Any"
          },
          {
            "name": "fileName",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Converse",
        "parameters": [
          {
            "name": "question",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ConverseWithImage",
        "parameters": [
          {
            "name": "question",
            "type": "Any"
          },
          {
            "name": "source",
            "type": "Any"
          }
        ]
      },
      {
        "name": "CreateImage",
        "parameters": [
          {
            "name": "description",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ResetConversation",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      },
      {
        "name": "Model",
        "type": "Any"
      },
      {
        "name": "Provider",
        "type": "Any"
      },
      {
        "name": "ServiceURL",
        "type": "Any"
      },
      {
        "name": "System",
        "type": "Any"
      },
      {
        "name": "Token",
        "type": "Any"
      }
    ]
  },
  "CheckBox": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Checked",
        "type": "Any"
      }
    ]
  },
  "Circle": {
    "events": [],
    "methods": [
      {
        "name": "SetLocation",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Latitude",
        "type": "Any"
      },
      {
        "name": "Longitude",
        "type": "Any"
      },
      {
        "name": "Radius",
        "type": "Any"
      },
      {
        "name": "TypeAbstract",
        "type": "Any"
      }
    ]
  },
  "CircularProgress": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Color",
        "type": "Any"
      }
    ]
  },
  "Clock": {
    "events": [
      {
        "name": "Timer",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "MakeDate",
        "parameters": [
          {
            "name": "year",
            "type": "Number"
          },
          {
            "name": "month",
            "type": "Number"
          },
          {
            "name": "day",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MakeInstantFromParts",
        "parameters": [
          {
            "name": "year",
            "type": "Number"
          },
          {
            "name": "month",
            "type": "Number"
          },
          {
            "name": "day",
            "type": "Number"
          },
          {
            "name": "hour",
            "type": "Number"
          },
          {
            "name": "minute",
            "type": "Number"
          },
          {
            "name": "second",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MakeTime",
        "parameters": [
          {
            "name": "hour",
            "type": "Number"
          },
          {
            "name": "minute",
            "type": "Number"
          },
          {
            "name": "second",
            "type": "Number"
          }
        ]
      },
      {
        "name": "onStop",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "TimerAlwaysFires",
        "type": "Any"
      },
      {
        "name": "TimerEnabled",
        "type": "Any"
      },
      {
        "name": "TimerInterval",
        "type": "Any"
      }
    ]
  },
  "CloudDB": {
    "events": [
      {
        "name": "CloudDBError",
        "parameters": [
          {
            "name": "message",
            "type": "Any"
          }
        ]
      },
      {
        "name": "DataChanged",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FirstRemoved",
        "parameters": [
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotValue",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "TagList",
        "parameters": [
          {
            "name": "value",
            "type": "List"
          }
        ]
      },
      {
        "name": "UpdateDone",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "operation",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "AppendValueToList",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "itemToAdd",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ClearTag",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          }
        ]
      },
      {
        "name": "CloudConnected",
        "parameters": []
      },
      {
        "name": "GetTagList",
        "parameters": []
      },
      {
        "name": "GetValue",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "valueIfTagNotThere",
            "type": "Any"
          }
        ]
      },
      {
        "name": "RemoveFirstFromList",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          }
        ]
      },
      {
        "name": "StoreValue",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "valueToStore",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "DefaultRedisServer",
        "type": "Any"
      },
      {
        "name": "ProjectID",
        "type": "Any"
      },
      {
        "name": "RedisPort",
        "type": "Any"
      },
      {
        "name": "RedisServer",
        "type": "Any"
      },
      {
        "name": "Token",
        "type": "Any"
      },
      {
        "name": "UseSSL",
        "type": "Any"
      }
    ]
  },
  "ContactPicker": {
    "events": [],
    "methods": [
      {
        "name": "ViewContact",
        "parameters": [
          {
            "name": "uri",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ContactName",
        "type": "Any"
      },
      {
        "name": "ContactUri",
        "type": "Any"
      },
      {
        "name": "EmailAddress",
        "type": "Any"
      },
      {
        "name": "EmailAddressList",
        "type": "Any"
      },
      {
        "name": "PhoneNumber",
        "type": "Any"
      },
      {
        "name": "PhoneNumberList",
        "type": "Any"
      },
      {
        "name": "Picture",
        "type": "Any"
      }
    ]
  },
  "DataCollection": {
    "events": [],
    "methods": [
      {
        "name": "Clear",
        "parameters": []
      },
      {
        "name": "GetAllEntries",
        "parameters": []
      },
      {
        "name": "GetEntriesWithXValue",
        "parameters": [
          {
            "name": "x",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetEntriesWithYValue",
        "parameters": [
          {
            "name": "y",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ImportFromCloudDB",
        "parameters": [
          {
            "name": "cloudDB",
            "type": "Any"
          },
          {
            "name": "tag",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ImportFromList",
        "parameters": [
          {
            "name": "list",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ImportFromTinyDB",
        "parameters": [
          {
            "name": "tinyDB",
            "type": "Any"
          },
          {
            "name": "tag",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ImportFromWeb",
        "parameters": [
          {
            "name": "web",
            "type": "Any"
          },
          {
            "name": "xValueColumn",
            "type": "String"
          },
          {
            "name": "yValueColumn",
            "type": "String"
          }
        ]
      },
      {
        "name": "RemoveDataSource",
        "parameters": []
      },
      {
        "name": "run",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "DataFileXColumn",
        "type": "Any"
      },
      {
        "name": "DataFileYColumn",
        "type": "Any"
      },
      {
        "name": "DataSourceKey",
        "type": "Any"
      },
      {
        "name": "ElementsFromPairs",
        "type": "Any"
      },
      {
        "name": "SpreadsheetUseHeaders",
        "type": "Any"
      },
      {
        "name": "SpreadsheetXColumn",
        "type": "Any"
      },
      {
        "name": "SpreadsheetYColumn",
        "type": "Any"
      },
      {
        "name": "WebXColumn",
        "type": "Any"
      },
      {
        "name": "WebYColumn",
        "type": "Any"
      }
    ]
  },
  "DataFile": {
    "events": [],
    "methods": [
      {
        "name": "ReadFile",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ColumnNames",
        "type": "Any"
      },
      {
        "name": "Columns",
        "type": "Any"
      },
      {
        "name": "Rows",
        "type": "Any"
      },
      {
        "name": "SourceFile",
        "type": "Any"
      }
    ]
  },
  "DatePicker": {
    "events": [
      {
        "name": "AfterDateSet",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "LaunchPicker",
        "parameters": []
      },
      {
        "name": "SetDateToDisplay",
        "parameters": [
          {
            "name": "year",
            "type": "Number"
          },
          {
            "name": "month",
            "type": "Number"
          },
          {
            "name": "day",
            "type": "Number"
          }
        ]
      },
      {
        "name": "SetDateToDisplayFromInstant",
        "parameters": [
          {
            "name": "instant",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Day",
        "type": "Any"
      },
      {
        "name": "Instant",
        "type": "Any"
      },
      {
        "name": "Month",
        "type": "Any"
      },
      {
        "name": "MonthInText",
        "type": "Any"
      },
      {
        "name": "Year",
        "type": "Any"
      }
    ]
  },
  "EmailPicker": {
    "events": [
      {
        "name": "GotFocus",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": []
  },
  "Ev3ColorSensor": {
    "events": [
      {
        "name": "AboveRange",
        "parameters": []
      },
      {
        "name": "BelowRange",
        "parameters": []
      },
      {
        "name": "ColorChanged",
        "parameters": [
          {
            "name": "colorCode",
            "type": "Number"
          },
          {
            "name": "colorName",
            "type": "String"
          }
        ]
      },
      {
        "name": "WithinRange",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "GetColorCode",
        "parameters": []
      },
      {
        "name": "GetColorName",
        "parameters": []
      },
      {
        "name": "GetLightLevel",
        "parameters": []
      },
      {
        "name": "SetAmbientMode",
        "parameters": []
      },
      {
        "name": "SetColorMode",
        "parameters": []
      },
      {
        "name": "SetReflectedMode",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboveRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BelowRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BottomOfRange",
        "type": "Any"
      },
      {
        "name": "ColorChangedEventEnabled",
        "type": "Any"
      },
      {
        "name": "Mode",
        "type": "Any"
      },
      {
        "name": "TopOfRange",
        "type": "Any"
      },
      {
        "name": "WithinRangeEventEnabled",
        "type": "Any"
      }
    ]
  },
  "Ev3Commands": {
    "events": [],
    "methods": [
      {
        "name": "GetBatteryCurrent",
        "parameters": []
      },
      {
        "name": "GetBatteryVoltage",
        "parameters": []
      },
      {
        "name": "GetFirmwareBuild",
        "parameters": []
      },
      {
        "name": "GetFirmwareVersion",
        "parameters": []
      },
      {
        "name": "GetHardwareVersion",
        "parameters": []
      },
      {
        "name": "GetOSBuild",
        "parameters": []
      },
      {
        "name": "GetOSVersion",
        "parameters": []
      },
      {
        "name": "KeepAlive",
        "parameters": [
          {
            "name": "minutes",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": []
  },
  "Ev3GyroSensor": {
    "events": [
      {
        "name": "SensorValueChanged",
        "parameters": [
          {
            "name": "sensorValue",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "GetSensorValue",
        "parameters": []
      },
      {
        "name": "SetAngleMode",
        "parameters": []
      },
      {
        "name": "SetRateMode",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Mode",
        "type": "Any"
      },
      {
        "name": "SensorValueChangedEventEnabled",
        "type": "Any"
      }
    ]
  },
  "Ev3Motors": {
    "events": [
      {
        "name": "TachoCountChanged",
        "parameters": [
          {
            "name": "tachoCount",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "GetTachoCount",
        "parameters": []
      },
      {
        "name": "ResetTachoCount",
        "parameters": []
      },
      {
        "name": "RotateIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "RotateInDistance",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "distance",
            "type": "Number"
          }
        ]
      },
      {
        "name": "RotateInDuration",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "millis",
            "type": "Number"
          }
        ]
      },
      {
        "name": "RotateInTachoCounts",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "tachoCounts",
            "type": "Number"
          }
        ]
      },
      {
        "name": "SetBrakeMode",
        "parameters": [
          {
            "name": "mode",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "SetReverseDirection",
        "parameters": [
          {
            "name": "reverse",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "Stop",
        "parameters": [
          {
            "name": "useBrake",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "ToggleDirection",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "TachoCountChangedEventEnabled",
        "type": "Any"
      }
    ]
  },
  "Ev3Sound": {
    "events": [],
    "methods": [
      {
        "name": "PlaySoundFile",
        "parameters": [
          {
            "name": "soundFile",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetFileVolume",
        "parameters": [
          {
            "name": "volume",
            "type": "Number"
          }
        ]
      },
      {
        "name": "StopSound",
        "parameters": []
      }
    ],
    "properties": []
  },
  "Ev3TouchSensor": {
    "events": [
      {
        "name": "Pressed",
        "parameters": []
      },
      {
        "name": "Released",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "IsPressed",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "PressedEventEnabled",
        "type": "Any"
      },
      {
        "name": "ReleasedEventEnabled",
        "type": "Any"
      }
    ]
  },
  "Ev3UI": {
    "events": [],
    "methods": [
      {
        "name": "DrawCircle",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "radius",
            "type": "Number"
          },
          {
            "name": "fill",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "DrawIcon",
        "parameters": [
          {
            "name": "type",
            "type": "Number"
          },
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "color",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawLine",
        "parameters": [
          {
            "name": "x1",
            "type": "Number"
          },
          {
            "name": "y1",
            "type": "Number"
          },
          {
            "name": "x2",
            "type": "Number"
          },
          {
            "name": "y2",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawPoint",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawText",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetFont",
        "parameters": [
          {
            "name": "type",
            "type": "Number"
          },
          {
            "name": "size",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": []
  },
  "Ev3UltrasonicSensor": {
    "events": [
      {
        "name": "AboveRange",
        "parameters": []
      },
      {
        "name": "BelowRange",
        "parameters": []
      },
      {
        "name": "WithinRange",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "GetDistance",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboveRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BelowRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BottomOfRange",
        "type": "Any"
      },
      {
        "name": "TopOfRange",
        "type": "Any"
      },
      {
        "name": "Unit",
        "type": "Any"
      },
      {
        "name": "WithinRangeEventEnabled",
        "type": "Any"
      }
    ]
  },
  "FeatureCollection": {
    "events": [],
    "methods": [
      {
        "name": "FeatureFromDescription",
        "parameters": [
          {
            "name": "description",
            "type": "String"
          }
        ]
      },
      {
        "name": "LoadFeatures",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Features",
        "type": "Any"
      },
      {
        "name": "Source",
        "type": "Any"
      }
    ]
  },
  "File": {
    "events": [
      {
        "name": "AfterFileSaved",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "GotText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "LegacySupportCreated",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "AppendToFile",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "CopyFile",
        "parameters": [
          {
            "name": "filePath",
            "type": "String"
          },
          {
            "name": "newFileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "Delete",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "IsDirectory",
        "parameters": [
          {
            "name": "path",
            "type": "String"
          }
        ]
      },
      {
        "name": "ListDirectory",
        "parameters": [
          {
            "name": "directory",
            "type": "String"
          }
        ]
      },
      {
        "name": "MakeDirectory",
        "parameters": [
          {
            "name": "directoryName",
            "type": "String"
          }
        ]
      },
      {
        "name": "MoveFile",
        "parameters": [
          {
            "name": "filePath",
            "type": "String"
          },
          {
            "name": "newFileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "ReadFrom",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "SaveFile",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      }
    ],
    "properties": []
  },
  "FilePicker": {
    "events": [
      {
        "name": "AfterPicking",
        "parameters": []
      },
      {
        "name": "BeforePicking",
        "parameters": []
      },
      {
        "name": "GotFocus",
        "parameters": []
      },
      {
        "name": "LostFocus",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Open",
        "parameters": []
      }
    ],
    "properties": []
  },
  "FirebaseDB": {
    "events": [
      {
        "name": "FirebaseError",
        "parameters": [
          {
            "name": "message",
            "type": "Any"
          }
        ]
      },
      {
        "name": "DataChanged",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FirstRemoved",
        "parameters": [
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotValue",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "TagList",
        "parameters": [
          {
            "name": "value",
            "type": "List"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "AppendValueToList",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "itemToAdd",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ClearTag",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          }
        ]
      },
      {
        "name": "GetTagList",
        "parameters": []
      },
      {
        "name": "GetValue",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "valueIfTagNotThere",
            "type": "Any"
          }
        ]
      },
      {
        "name": "RemoveFirstFromList",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          }
        ]
      },
      {
        "name": "StoreValue",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "valueToStore",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Unauthenticate",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "DefaultURL",
        "type": "Any"
      },
      {
        "name": "FirebaseToken",
        "type": "Any"
      },
      {
        "name": "ProjectBucket",
        "type": "Any"
      },
      {
        "name": "ProjectID",
        "type": "Any"
      },
      {
        "name": "URL",
        "type": "Any"
      }
    ]
  },
  "FusiontablesControl": {
    "events": [
      {
        "name": "GotResult",
        "parameters": [
          {
            "name": "result",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "AttachQuery",
        "parameters": [
          {
            "name": "apiKey",
            "type": "String"
          }
        ]
      },
      {
        "name": "DeleteRow",
        "parameters": [
          {
            "name": "rowId",
            "type": "String"
          }
        ]
      },
      {
        "name": "ForgetLogin",
        "parameters": []
      },
      {
        "name": "GetRows",
        "parameters": []
      },
      {
        "name": "HandleRequest",
        "parameters": [
          {
            "name": "query",
            "type": "String"
          }
        ]
      },
      {
        "name": "InsertRow",
        "parameters": [
          {
            "name": "rowContents",
            "type": "List"
          }
        ]
      },
      {
        "name": "SendQuery",
        "parameters": [
          {
            "name": "query",
            "type": "String"
          }
        ]
      }
    ],
    "properties": []
  },
  "GameClient": {
    "events": [
      {
        "name": "GotMessage",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "WebLost",
        "parameters": []
      },
      {
        "name": "WebReady",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "InformWebOfName",
        "parameters": [
          {
            "name": "playerName",
            "type": "String"
          }
        ]
      },
      {
        "name": "KeepWebAlive",
        "parameters": []
      },
      {
        "name": "MakeMove",
        "parameters": [
          {
            "name": "move",
            "type": "String"
          }
        ]
      },
      {
        "name": "NotifyWebOfSignIn",
        "parameters": []
      },
      {
        "name": "SendMessage",
        "parameters": [
          {
            "name": "playerName",
            "type": "String"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetWebPlayerName",
        "parameters": [
          {
            "name": "webPlayerName",
            "type": "String"
          }
        ]
      },
      {
        "name": "ValueChanged",
        "parameters": [
          {
            "name": "value",
            "type": "String"
          }
        ]
      }
    ],
    "properties": []
  },
  "GyroscopeSensor": {
    "events": [
      {
        "name": "GyroscopeChanged",
        "parameters": [
          {
            "name": "xAngularVelocity",
            "type": "Number"
          },
          {
            "name": "yAngularVelocity",
            "type": "Number"
          },
          {
            "name": "zAngularVelocity",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "XAngularVelocity",
        "type": "Any"
      },
      {
        "name": "YAngularVelocity",
        "type": "Any"
      },
      {
        "name": "ZAngularVelocity",
        "type": "Any"
      }
    ]
  },
  "HVArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "HealthData": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "HorizontalArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "HorizontalScrollArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "Hygrometer": {
    "events": [
      {
        "name": "HumidityChanged",
        "parameters": [
          {
            "name": "humidity",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Humidity",
        "type": "Any"
      }
    ]
  },
  "Image": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlternateText",
        "type": "Any"
      },
      {
        "name": "Clickable",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Picture",
        "type": "Any"
      },
      {
        "name": "RotationAngle",
        "type": "Any"
      },
      {
        "name": "ScalePictureToFit",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "ImagePicker": {
    "events": [
      {
        "name": "AfterPicking",
        "parameters": []
      },
      {
        "name": "BeforePicking",
        "parameters": []
      },
      {
        "name": "GotFocus",
        "parameters": []
      },
      {
        "name": "LostFocus",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Open",
        "parameters": []
      }
    ],
    "properties": []
  },
  "ImageSprite": {
    "events": [
      {
        "name": "CollidedWith",
        "parameters": [
          {
            "name": "other",
            "type": "Component"
          }
        ]
      },
      {
        "name": "Dragged",
        "parameters": [
          {
            "name": "startX",
            "type": "Number"
          },
          {
            "name": "startY",
            "type": "Number"
          },
          {
            "name": "prevX",
            "type": "Number"
          },
          {
            "name": "prevY",
            "type": "Number"
          },
          {
            "name": "currentX",
            "type": "Number"
          },
          {
            "name": "currentY",
            "type": "Number"
          }
        ]
      },
      {
        "name": "EdgeReached",
        "parameters": [
          {
            "name": "edge",
            "type": "Number"
          }
        ]
      },
      {
        "name": "NoLongerCollidingWith",
        "parameters": [
          {
            "name": "other",
            "type": "Component"
          }
        ]
      },
      {
        "name": "Touched",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Flung",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          },
          {
            "name": "speed",
            "type": "Number"
          },
          {
            "name": "heading",
            "type": "Number"
          },
          {
            "name": "xvel",
            "type": "Number"
          },
          {
            "name": "yvel",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Bounce",
        "parameters": [
          {
            "name": "edge",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MoveIntoBounds",
        "parameters": []
      },
      {
        "name": "MoveTo",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "PointInDirection",
        "parameters": [
          {
            "name": "x",
            "type": "Number"
          },
          {
            "name": "y",
            "type": "Number"
          }
        ]
      },
      {
        "name": "PointTowards",
        "parameters": [
          {
            "name": "target",
            "type": "Component"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "Heading",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Interval",
        "type": "Any"
      },
      {
        "name": "Picture",
        "type": "Any"
      },
      {
        "name": "Rotates",
        "type": "Any"
      },
      {
        "name": "Speed",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      },
      {
        "name": "X",
        "type": "Any"
      },
      {
        "name": "Y",
        "type": "Any"
      },
      {
        "name": "Z",
        "type": "Any"
      }
    ]
  },
  "LegoMindstormsEv3Base": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BluetoothClient",
        "type": "Any"
      }
    ]
  },
  "LegoMindstormsEv3Sensor": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "SensorPort",
        "type": "Any"
      }
    ]
  },
  "LegoMindstormsNxtBase": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BluetoothClient",
        "type": "Any"
      }
    ]
  },
  "LegoMindstormsNxtSensor": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "SensorPort",
        "type": "Any"
      }
    ]
  },
  "LightSensor": {
    "events": [
      {
        "name": "LightChanged",
        "parameters": [
          {
            "name": "light",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "AverageLux",
        "type": "Any"
      },
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "Light",
        "type": "Any"
      }
    ]
  },
  "LineString": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Points",
        "type": "Any"
      },
      {
        "name": "PointsFromString",
        "type": "Any"
      },
      {
        "name": "TypeAbstract",
        "type": "Any"
      }
    ]
  },
  "ListPicker": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Items",
        "type": "Any"
      },
      {
        "name": "Selection",
        "type": "Any"
      },
      {
        "name": "SelectionIndex",
        "type": "Any"
      },
      {
        "name": "ShowFilterBar",
        "type": "Any"
      },
      {
        "name": "Title",
        "type": "Any"
      }
    ]
  },
  "ListPickerBase": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      }
    ]
  },
  "LocationSensor": {
    "events": [
      {
        "name": "LocationChanged",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          },
          {
            "name": "altitude",
            "type": "Number"
          },
          {
            "name": "speed",
            "type": "Number"
          }
        ]
      },
      {
        "name": "StatusChanged",
        "parameters": [
          {
            "name": "provider",
            "type": "String"
          },
          {
            "name": "status",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Accuracy",
        "type": "Any"
      },
      {
        "name": "Altitude",
        "type": "Any"
      },
        {
        "name": "DistanceInterval",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "HasAccuracy",
        "type": "Any"
      },
      {
        "name": "HasAltitude",
        "type": "Any"
      },
      {
        "name": "HasLongitudeLatitude",
        "type": "Any"
      },
      {
        "name": "Latitude",
        "type": "Any"
      },
      {
        "name": "Longitude",
        "type": "Any"
      },
      {
        "name": "ProviderName",
        "type": "Any"
      },
      {
        "name": "TimeInterval",
        "type": "Any"
      }
    ]
  },
  "Map": {
    "events": [
      {
        "name": "BoundsChange",
        "parameters": [
          {
            "name": "west",
            "type": "Number"
          },
          {
            "name": "east",
            "type": "Number"
          },
          {
            "name": "north",
            "type": "Number"
          },
          {
            "name": "south",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DoubleTap",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "FeatureClick",
        "parameters": [
          {
            "name": "feature",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FeatureDrag",
        "parameters": [
          {
            "name": "feature",
            "type": "Any"
          },
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "FeatureLongClick",
        "parameters": [
          {
            "name": "feature",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FeatureStartDrag",
        "parameters": [
          {
            "name": "feature",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FeatureStopDrag",
        "parameters": [
          {
            "name": "feature",
            "type": "Any"
          }
        ]
      },
      {
        "name": "InvalidPoint",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "LongPress",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Ready",
        "parameters": []
      },
      {
        "name": "ZoomChange",
        "parameters": [
          {
            "name": "zoom",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "BoundingBox",
        "parameters": [
          {
            "name": "west",
            "type": "Number"
          },
          {
            "name": "east",
            "type": "Number"
          },
          {
            "name": "north",
            "type": "Number"
          },
          {
            "name": "south",
            "type": "Number"
          }
        ]
      },
      {
        "name": "CenterFromString",
        "parameters": [
          {
            "name": "locationString",
            "type": "String"
          }
        ]
      },
      {
        "name": "CreateMarker",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "FitBounds",
        "parameters": [
          {
            "name": "west",
            "type": "Number"
          },
          {
            "name": "east",
            "type": "Number"
          },
          {
            "name": "north",
            "type": "Number"
          },
          {
            "name": "south",
            "type": "Number"
          }
        ]
      },
      {
        "name": "PanTo",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Save",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "BoundingBox",
        "type": "Any"
      },
      {
        "name": "CenterFromString",
        "type": "Any"
      },
      {
        "name": "EnablePan",
        "type": "Any"
      },
      {
        "name": "EnableRotation",
        "type": "Any"
      },
      {
        "name": "EnableZoom",
        "type": "Any"
      },
      {
        "name": "Latitude",
        "type": "Any"
      },
      {
        "name": "LocationSensor",
        "type": "Any"
      },
      {
        "name": "Longitude",
        "type": "Any"
      },
      {
        "name": "MapType",
        "type": "Any"
      },
      {
        "name": "Rotation",
        "type": "Any"
      },
      {
        "name": "ScaleUnits",
        "type": "Any"
      },
      {
        "name": "ShowCompass",
        "type": "Any"
      },
      {
        "name": "ShowUser",
        "type": "Any"
      },
      {
        "name": "ShowZoom",
        "type": "Any"
      },
      {
        "name": "UserLatitude",
        "type": "Any"
      },
      {
        "name": "UserLongitude",
        "type": "Any"
      },
      {
        "name": "ZoomLevel",
        "type": "Any"
      }
    ]
  },
  "Marker": {
    "events": [
      {
        "name": "Click",
        "parameters": []
      },
      {
        "name": "Drag",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      },
      {
        "name": "LongClick",
        "parameters": []
      },
      {
        "name": "StartDrag",
        "parameters": []
      },
      {
        "name": "StopDrag",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "SetLocation",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Address",
        "type": "Any"
      },
      {
        "name": "Altitude",
        "type": "Any"
      },
      {
        "name": "Category",
        "type": "Any"
      },
      {
        "name": "Description",
        "type": "Any"
      },
      {
        "name": "Draggable",
        "type": "Any"
      },
      {
        "name": "EnableInfobox",
        "type": "Any"
      },
      {
        "name": "FillColor",
        "type": "Any"
      },
      {
        "name": "FillOpacity",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      },
      {
        "name": "InfoboxContent",
        "type": "Any"
      },
      {
        "name": "Latitude",
        "type": "Any"
      },
      {
        "name": "Longitude",
        "type": "Any"
      },
      {
        "name": "ShowShadow",
        "type": "Any"
      },
      {
        "name": "StrokeColor",
        "type": "Any"
      },
      {
        "name": "StrokeOpacity",
        "type": "Any"
      },
      {
        "name": "StrokeWidth",
        "type": "Any"
      },
      {
        "name": "Title",
        "type": "Any"
      },
      {
        "name": "TypeAbstract",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "Microphone": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Navigator": {
    "events": [],
    "methods": [
      {
        "name": "ArriveAtStop",
        "parameters": []
      },
      {
        "name": "Departs",
        "parameters": []
      },
      {
        "name": "NavigationCompleted",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "EndLocation",
        "type": "Any"
      },
      {
        "name": "EndLocationAbstract",
        "type": "Any"
      },
      {
        "name": "StartLocation",
        "type": "Any"
      },
      {
        "name": "StartLocationAbstract",
        "type": "Any"
      },
      {
        "name": "TransportationMethod",
        "type": "Any"
      }
    ]
  },
  "NearField": {
    "events": [
      {
        "name": "TagRead",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "LastMessage",
        "type": "Any"
      },
      {
        "name": "ReadMode",
        "type": "Any"
      },
      {
        "name": "TextToWrite",
        "type": "Any"
      },
      {
        "name": "WriteType",
        "type": "Any"
      }
    ]
  },
  "NxtColorSensor": {
    "events": [
      {
        "name": "ColorChanged",
        "parameters": [
          {
            "name": "colorCode",
            "type": "Number"
          },
          {
            "name": "colorName",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "GetColorCode",
        "parameters": []
      },
      {
        "name": "GetColorName",
        "parameters": []
      },
      {
        "name": "SetGenerateColor",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ColorChangedEventEnabled",
        "type": "Any"
      },
      {
        "name": "DetectColor",
        "type": "Any"
      },
      {
        "name": "Mode",
        "type": "Any"
      }
    ]
  },
  "NxtDirectCommands": {
    "events": [],
    "methods": [
      {
        "name": "DeleteFile",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "DownloadFile",
        "parameters": [
          {
            "name": "source",
            "type": "String"
          },
          {
            "name": "destination",
            "type": "String"
          }
        ]
      },
      {
        "name": "GetBatteryLevel",
        "parameters": []
      },
      {
        "name": "GetBrickName",
        "parameters": []
      },
      {
        "name": "GetCurrentProgramName",
        "parameters": []
      },
      {
        "name": "GetFirmwareVersion",
        "parameters": []
      },
      {
        "name": "GetMoveStatus",
        "parameters": []
      },
      {
        "name": "GetOutputState",
        "parameters": [
          {
            "name": "motorPort",
            "type": "String"
          }
        ]
      },
      {
        "name": "InitializeFirmware",
        "parameters": []
      },
      {
        "name": "ListFiles",
        "parameters": []
      },
      {
        "name": "LsBack",
        "parameters": [
          {
            "name": "motorPort",
            "type": "String"
          }
        ]
      },
      {
        "name": "LsGetStatus",
        "parameters": [
          {
            "name": "motorPort",
            "type": "String"
          }
        ]
      },
      {
        "name": "LsRead",
        "parameters": [
          {
            "name": "txData",
            "type": "Any"
          }
        ]
      },
      {
        "name": "LsWrite",
        "parameters": [
          {
            "name": "txData",
            "type": "Any"
          },
          {
            "name": "rxDataLength",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MessageRead",
        "parameters": [
          {
            "name": "mailbox",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MessageWrite",
        "parameters": [
          {
            "name": "mailbox",
            "type": "Number"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "PlaySoundFile",
        "parameters": [
          {
            "name": "soundFile",
            "type": "String"
          }
        ]
      },
      {
        "name": "PlayTone",
        "parameters": [
          {
            "name": "frequencyHz",
            "type": "Number"
          },
          {
            "name": "durationMs",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ResetInputScaledValue",
        "parameters": [
          {
            "name": "motorPort",
            "type": "String"
          }
        ]
      },
      {
        "name": "ResetMotorPosition",
        "parameters": [
          {
            "name": "motorPort",
            "type": "String"
          },
          {
            "name": "relative",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "SetBrickName",
        "parameters": [
          {
            "name": "name",
            "type": "String"
          }
        ]
      },
      {
        "name": "StartProgram",
        "parameters": [
          {
            "name": "programName",
            "type": "String"
          }
        ]
      },
      {
        "name": "StopProgram",
        "parameters": []
      }
    ],
    "properties": []
  },
  "NxtDrive": {
    "events": [],
    "methods": [
      {
        "name": "MoveBackward",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MoveBackwardIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MoveForward",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MoveForwardIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Stop",
        "parameters": [
          {
            "name": "useBrake",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "TurnClockwiseIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      },
      {
        "name": "TurnCounterClockwiseIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": []
  },
  "NxtLightSensor": {
    "events": [
      {
        "name": "LightChanged",
        "parameters": [
          {
            "name": "lightLevel",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "GenerateColor",
        "parameters": []
      },
      {
        "name": "ReadLightLevel",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboveRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BelowRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BottomOfRange",
        "type": "Any"
      },
      {
        "name": "ColorChangedEventEnabled",
        "type": "Any"
      },
      {
        "name": "DetectColor",
        "type": "Any"
      },
      {
        "name": "GenerateColor",
        "type": "Any"
      },
      {
        "name": "TopOfRange",
        "type": "Any"
      },
      {
        "name": "WithinRangeEventEnabled",
        "type": "Any"
      }
    ]
  },
  "NxtSoundSensor": {
    "events": [
      {
        "name": "SoundChanged",
        "parameters": [
          {
            "name": "soundLevel",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "ReadSoundLevel",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboveRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BelowRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BottomOfRange",
        "type": "Any"
      },
      {
        "name": "TopOfRange",
        "type": "Any"
      },
      {
        "name": "WithinRangeEventEnabled",
        "type": "Any"
      }
    ]
  },
  "NxtTouchSensor": {
    "events": [
      {
        "name": "Pressed",
        "parameters": []
      },
      {
        "name": "Released",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "IsPressed",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "PressedEventEnabled",
        "type": "Any"
      },
      {
        "name": "ReleasedEventEnabled",
        "type": "Any"
      }
    ]
  },
  "NxtUltrasonicSensor": {
    "events": [
      {
        "name": "AboveRange",
        "parameters": []
      },
      {
        "name": "BelowRange",
        "parameters": []
      },
      {
        "name": "WithinRange",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "CheckDistance",
        "parameters": [
          {
            "name": "type",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReadDistance",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboveRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BelowRangeEventEnabled",
        "type": "Any"
      },
      {
        "name": "BottomOfRange",
        "type": "Any"
      },
      {
        "name": "TopOfRange",
        "type": "Any"
      },
      {
        "name": "WithinRangeEventEnabled",
        "type": "Any"
      }
    ]
  },
  "OrientationSensor": {
    "events": [
      {
        "name": "OrientationChanged",
        "parameters": [
          {
            "name": "azimuth",
            "type": "Number"
          },
          {
            "name": "pitch",
            "type": "Number"
          },
          {
            "name": "roll",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Angle",
        "type": "Any"
      },
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "Azimuth",
        "type": "Any"
      },
      {
        "name": "Magnitude",
        "type": "Any"
      },
      {
        "name": "Pitch",
        "type": "Any"
      },
      {
        "name": "Roll",
        "type": "Any"
      }
    ]
  },
  "PasswordTextBox": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Hint",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "Pedometer": {
    "events": [],
    "methods": [
      {
        "name": "Reset",
        "parameters": []
      },
      {
        "name": "Save",
        "parameters": []
      },
      {
        "name": "SimpleStep",
        "parameters": [
          {
            "name": "simpleSteps",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Start",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Distance",
        "type": "Any"
      },
      {
        "name": "Calories",
        "type": "Any"
      },
      {
        "name": "Steps",
        "type": "Any"
      },
      {
        "name": "WalkStep",
        "type": "Any"
      }
    ]
  },
  "PhoneCall": {
    "events": [
      {
        "name": "CallStateChanged",
        "parameters": [
          {
            "name": "phoneNumber",
            "type": "String"
          },
          {
            "name": "status",
            "type": "Number"
          }
        ]
      },
      {
        "name": "IncomingCallAnswered",
        "parameters": [
          {
            "name": "phoneNumber",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "MakePhoneCall",
        "parameters": [
          {
            "name": "phoneNumber",
            "type": "String"
          }
        ]
      },
      {
        "name": "MakePhoneCallFromNumber",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "PhoneNumber",
        "type": "Any"
      },
      {
        "name": "PhoneNumberAbstract",
        "type": "Any"
      }
    ]
  },
  "PhoneNumberPicker": {
    "events": [
      {
        "name": "AfterPicking",
        "parameters": []
      },
      {
        "name": "BeforePicking",
        "parameters": []
      },
      {
        "name": "GotFocus",
        "parameters": []
      },
      {
        "name": "LostFocus",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Open",
        "parameters": []
      }
    ],
    "properties": []
  },
  "Picker": {
    "events": [
      {
        "name": "AfterPicking",
        "parameters": []
      },
      {
        "name": "BeforePicking",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Open",
        "parameters": []
      }
    ],
    "properties": []
  },
  "Player": {
    "events": [
      {
        "name": "Completed",
        "parameters": []
      },
      {
        "name": "OtherPlayerStarted",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Pause",
        "parameters": []
      },
      {
        "name": "Play",
        "parameters": []
      },
      {
        "name": "Start",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "IsLooping",
        "type": "Any"
      },
      {
        "name": "PlayOnlyInForeground",
        "type": "Any"
      },
      {
        "name": "Source",
        "type": "Any"
      },
      {
        "name": "Volume",
        "type": "Any"
      }
    ]
  },
  "Polygon": {
    "events": [],
    "methods": [
      {
        "name": "SetLocation",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "CentroidAbstract",
        "type": "Any"
      },
      {
        "name": "Description",
        "type": "Any"
      },
      {
        "name": "FillColor",
        "type": "Any"
      },
      {
        "name": "FillOpacity",
        "type": "Any"
      },
      {
        "name": "Points",
        "type": "Any"
      },
      {
        "name": "PointsFromString",
        "type": "Any"
      },
      {
        "name": "StrokeColor",
        "type": "Any"
      },
      {
        "name": "StrokeOpacity",
        "type": "Any"
      },
      {
        "name": "StrokeWidth",
        "type": "Any"
      },
      {
        "name": "Title",
        "type": "Any"
      },
      {
        "name": "TypeAbstract",
        "type": "Any"
      }
    ]
  },
  "ProximitySensor": {
    "events": [
      {
        "name": "ProximityChanged",
        "parameters": [
          {
            "name": "distance",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "Distance",
        "type": "Any"
      },
      {
        "name": "KeepAwakeInBackground",
        "type": "Any"
      },
      {
        "name": "MaximumRange",
        "type": "Any"
      }
    ]
  },
  "Rectangle": {
    "events": [],
    "methods": [
      {
        "name": "SetLocation",
        "parameters": [
          {
            "name": "latitude",
            "type": "Number"
          },
          {
            "name": "longitude",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Description",
        "type": "Any"
      },
      {
        "name": "EastLongitude",
        "type": "Any"
      },
      {
        "name": "FillColor",
        "type": "Any"
      },
      {
        "name": "FillOpacity",
        "type": "Any"
      },
      {
        "name": "NorthLatitude",
        "type": "Any"
      },
      {
        "name": "SouthLatitude",
        "type": "Any"
      },
      {
        "name": "StrokeColor",
        "type": "Any"
      },
      {
        "name": "StrokeOpacity",
        "type": "Any"
      },
      {
        "name": "StrokeWidth",
        "type": "Any"
      },
      {
        "name": "Title",
        "type": "Any"
      },
      {
        "name": "TypeAbstract",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "WestLongitude",
        "type": "Any"
      }
    ]
  },
  "Regression": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Screen": {
    "events": [
      {
        "name": "BackPressed",
        "parameters": []
      },
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "component",
            "type": "Component"
          },
          {
            "name": "functionName",
            "type": "String"
          },
          {
            "name": "errorNumber",
            "type": "Number"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "Initialize",
        "parameters": []
      },
      {
        "name": "OtherScreenClosed",
        "parameters": [
          {
            "name": "otherScreenName",
            "type": "String"
          },
          {
            "name": "result",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ScreenOrientationChanged",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "AboutScreen",
        "type": "Any"
      },
      {
        "name": "AboutScreenAbstract",
        "type": "Any"
      },
      {
        "name": "AccentColor",
        "type": "Any"
      },
      {
        "name": "ActionBar",
        "type": "Any"
      },
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "AppName",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "BackgroundImage",
        "type": "Any"
      },
      {
        "name": "BigDefaultIcon",
        "type": "Any"
      },
      {
        "name": "CompassHeading",
        "type": "Any"
      },
      {
        "name": "DefaultFileScope",
        "type": "Any"
      },
      {
        "name": "DismissKeyboard",
        "type": "Any"
      },
      {
        "name": "HighContrast",
        "type": "Any"
      },
      {
        "name": "Icon",
        "type": "Any"
      },
      {
        "name": "MaintainAspectRatio",
        "type": "Any"
      },
      {
        "name": "OpenScreenAnimation",
        "type": "Any"
      },
      {
        "name": "Platform",
        "type": "Any"
      },
      {
        "name": "PlatformVersion",
        "type": "Any"
      },
      {
        "name": "PrimaryColor",
        "type": "Any"
      },
      {
        "name": "PrimaryColorDark",
        "type": "Any"
      },
      {
        "name": "ScreenOrientation",
        "type": "Any"
      },
      {
        "name": "ScreenOrientationAbstract",
        "type": "Any"
      },
      {
        "name": "Scrollable",
        "type": "Any"
      },
      {
        "name": "SecondaryColor",
        "type": "Any"
      },
      {
        "name": "ShowListsAsJson",
        "type": "Any"
      },
      {
        "name": "ShowStatusBar",
        "type": "Any"
      },
      {
        "name": "Sizing",
        "type": "Any"
      },
      {
        "name": "Theme",
        "type": "Any"
      },
      {
        "name": "Title",
        "type": "Any"
      },
      {
        "name": "TitleVisible",
        "type": "Any"
      },
      {
        "name": "TutorialURL",
        "type": "Any"
      },
      {
        "name": "VersionCode",
        "type": "Any"
      },
      {
        "name": "VersionName",
        "type": "Any"
      }
    ]
  },
  "Serial": {
    "events": [
      {
        "name": "SerialError",
        "parameters": [
          {
            "name": "functionName",
            "type": "String"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "CloseSerial",
        "parameters": []
      },
      {
        "name": "OpenSerial",
        "parameters": []
      },
      {
        "name": "ReadSerial",
        "parameters": [
          {
            "name": "numberOfBytes",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReadSerialBytes",
        "parameters": [
          {
            "name": "numberOfBytes",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReadSerialLine",
        "parameters": []
      },
      {
        "name": "WriteSerial",
        "parameters": [
          {
            "name": "data",
            "type": "String"
          }
        ]
      },
      {
        "name": "WriteSerialBytes",
        "parameters": [
          {
            "name": "list",
            "type": "List"
          }
        ]
      },
      {
        "name": "WriteSerialWithNewline",
        "parameters": [
          {
            "name": "data",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "BaudRate",
        "type": "Any"
      },
      {
        "name": "BufferSize",
        "type": "Any"
      },
      {
        "name": "IsOpen",
        "type": "Any"
      },
      {
        "name": "Toggle",
        "type": "Any"
      }
    ]
  },
  "Sharing": {
    "events": [],
    "methods": [
      {
        "name": "ShareFile",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "ShareFileWithMessage",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          },
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "ShareMessage",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "properties": []
  },
  "SingleValueSensor": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Slider": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Sound": {
    "events": [],
    "methods": [
      {
        "name": "Pause",
        "parameters": []
      },
      {
        "name": "Play",
        "parameters": []
      },
      {
        "name": "Resume",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      },
      {
        "name": "Vibrate",
        "parameters": [
          {
            "name": "millis",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "MinimumInterval",
        "type": "Any"
      },
      {
        "name": "Sound",
        "type": "Any"
      }
    ]
  },
  "SoundRecorder": {
    "events": [
      {
        "name": "AfterSoundRecorded",
        "parameters": [
          {
            "name": "sound",
            "type": "String"
          }
        ]
      },
      {
        "name": "StartedRecording",
        "parameters": []
      },
      {
        "name": "StoppedRecording",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Start",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      }
    ],
    "properties": []
  },
  "SpeechRecognizer": {
    "events": [
      {
        "name": "AfterGettingText",
        "parameters": [
          {
            "name": "result",
            "type": "String"
          },
          {
            "name": "confidence",
            "type": "Number"
          }
        ]
      },
      {
        "name": "BeforeGettingText",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "GetText",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Language",
        "type": "Any"
      },
      {
        "name": "Result",
        "type": "Any"
      },
      {
        "name": "UseLegacy",
        "type": "Any"
      }
    ]
  },
  "Spinner": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Prompt",
        "type": "Any"
      },
      {
        "name": "Selection",
        "type": "Any"
      },
      {
        "name": "SelectionIndex",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "SplitArrangement": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Spreadsheet": {
    "events": [
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "errorMessage",
            "type": "String"
          }
        ]
      },
      {
        "name": "GotSheetData",
        "parameters": [
          {
            "name": "sheetData",
            "type": "List"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "AddRow",
        "parameters": [
          {
            "name": "rowData",
            "type": "List"
          }
        ]
      },
      {
        "name": "DeleteRow",
        "parameters": [
          {
            "name": "rowNumber",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetCellValue",
        "parameters": [
          {
            "name": "columnName",
            "type": "String"
          },
          {
            "name": "rowNumber",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetSheetData",
        "parameters": []
      },
      {
        "name": "InsertColumn",
        "parameters": [
          {
            "name": "columnName",
            "type": "String"
          },
          {
            "name": "columnData",
            "type": "List"
          }
        ]
      },
      {
        "name": "RemoveColumn",
        "parameters": [
          {
            "name": "columnName",
            "type": "String"
          }
        ]
      },
      {
        "name": "SortByColumn",
        "parameters": [
          {
            "name": "columnName",
            "type": "String"
          },
          {
            "name": "isAscending",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "UpdateCell",
        "parameters": [
          {
            "name": "columnName",
            "type": "String"
          },
          {
            "name": "rowNumber",
            "type": "Number"
          },
          {
            "name": "data",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ApplicationName",
        "type": "Any"
      },
      {
        "name": "CredentialsFile",
        "type": "Any"
      },
      {
        "name": "SheetID",
        "type": "Any"
      }
    ]
  },
  "Switch": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "On",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "ThumbColorActive",
        "type": "Any"
      },
      {
        "name": "ThumbColorInactive",
        "type": "Any"
      },
      {
        "name": "ThumbEnabled",
        "type": "Any"
      },
      {
        "name": "TrackColorActive",
        "type": "Any"
      },
      {
        "name": "TrackColorInactive",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "TextBox": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "FontBold",
        "type": "Any"
      },
      {
        "name": "FontItalic",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Hint",
        "type": "Any"
      },
      {
        "name": "MultiLine",
        "type": "Any"
      },
      {
        "name": "NumbersOnly",
        "type": "Any"
      },
      {
        "name": "ReadOnly",
        "type": "Any"
      },
      {
        "name": "Text",
        "type": "Any"
      },
      {
        "name": "TextAlignment",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "TextBoxBase": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "TextToSpeech": {
    "events": [
      {
        "name": "AfterSpeaking",
        "parameters": [
          {
            "name": "result",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "BeforeSpeaking",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "Speak",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Country",
        "type": "Any"
      },
      {
        "name": "Language",
        "type": "Any"
      },
      {
        "name": "Pitch",
        "type": "Any"
      },
      {
        "name": "SpeechRate",
        "type": "Any"
      }
    ]
  },
  "Thermometer": {
    "events": [
      {
        "name": "TemperatureChanged",
        "parameters": [
          {
            "name": "temperature",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "Temperature",
        "type": "Any"
      }
    ]
  },
  "TimePicker": {
    "events": [
      {
        "name": "AfterTimeSet",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "LaunchPicker",
        "parameters": []
      },
      {
        "name": "SetTimeToDisplay",
        "parameters": [
          {
            "name": "hour",
            "type": "Number"
          },
          {
            "name": "minute",
            "type": "Number"
          }
        ]
      },
      {
        "name": "SetTimeToDisplayFromInstant",
        "parameters": [
          {
            "name": "instant",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Hour",
        "type": "Any"
      },
      {
        "name": "Instant",
        "type": "Any"
      },
      {
        "name": "Minute",
        "type": "Any"
      }
    ]
  },
  "TinyDB": {
    "events": [],
    "methods": [
      {
        "name": "ClearAll",
        "parameters": []
      },
      {
        "name": "ClearTag",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          }
        ]
      },
      {
        "name": "GetTags",
        "parameters": []
      },
      {
        "name": "GetValue",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "valueIfTagNotThere",
            "type": "Any"
          }
        ]
      },
      {
        "name": "StoreValue",
        "parameters": [
          {
            "name": "tag",
            "type": "String"
          },
          {
            "name": "valueToStore",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Namespace",
        "type": "Any"
      }
    ]
  },
  "ToggleBase": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "TouchComponent": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Trendline": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "VerticalArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "VerticalScrollArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "AlignHorizontal",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "BackgroundColor",
        "type": "Any"
      },
      {
        "name": "Image",
        "type": "Any"
      }
    ]
  },
  "VideoPlayer": {
    "events": [
      {
        "name": "Completed",
        "parameters": []
      },
      {
        "name": "PlayerError",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Pause",
        "parameters": []
      },
      {
        "name": "Start",
        "parameters": []
      },
      {
        "name": "Stop",
        "parameters": []
      },
      {
        "name": "SeekTo",
        "parameters": [
          {
            "name": "ms",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetDurationMS",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Source",
        "type": "Any"
      },
      {
        "name": "VideoHeight",
        "type": "Any"
      },
      {
        "name": "VideoWidth",
        "type": "Any"
      }
    ]
  },
  "Viewer": {
    "events": [],
    "methods": [],
    "properties": []
  },
  "Voting": {
    "events": [
      {
        "name": "GotBallotInfo",
        "parameters": [
          {
            "name": "ballotInfo",
            "type": "String"
          }
        ]
      },
      {
        "name": "NoOpenPoll",
        "parameters": []
      },
      {
        "name": "UserAlreadyVoted",
        "parameters": [
          {
            "name": "email",
            "type": "String"
          }
        ]
      },
      {
        "name": "VoteFailure",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "VoteSuccess",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "CastVote",
        "parameters": [
          {
            "name": "ballotId",
            "type": "String"
          },
          {
            "name": "optionId",
            "type": "String"
          }
        ]
      },
      {
        "name": "GetBallotInfo",
        "parameters": [
          {
            "name": "ballotId",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "EmailAddress",
        "type": "Any"
      },
      {
        "name": "UserID",
        "type": "Any"
      }
    ]
  },
  "Web": {
    "events": [
      {
        "name": "GotFile",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          },
          {
            "name": "responseCode",
            "type": "Number"
          },
          {
            "name": "responseType",
            "type": "String"
          },
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "GotText",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          },
          {
            "name": "responseCode",
            "type": "Number"
          },
          {
            "name": "responseType",
            "type": "String"
          },
          {
            "name": "responseContent",
            "type": "String"
          }
        ]
      },
      {
        "name": "TimedOut",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "BuildRequestData",
        "parameters": [
          {
            "name": "list",
            "type": "List"
          }
        ]
      },
      {
        "name": "ClearCookies",
        "parameters": []
      },
      {
        "name": "Delete",
        "parameters": []
      },
      {
        "name": "Get",
        "parameters": []
      },
      {
        "name": "HtmlTextDecode",
        "parameters": [
          {
            "name": "htmlText",
            "type": "String"
          }
        ]
      },
      {
        "name": "JsonObjectEncode",
        "parameters": [
          {
            "name": "jsonObject",
            "type": "Any"
          }
        ]
      },
      {
        "name": "JsonTextDecode",
        "parameters": [
          {
            "name": "jsonText",
            "type": "String"
          }
        ]
      },
      {
        "name": "JsonTextDecodeWithDictionaries",
        "parameters": [
          {
            "name": "jsonText",
            "type": "String"
          }
        ]
      },
      {
        "name": "PatchFile",
        "parameters": [
          {
            "name": "path",
            "type": "String"
          }
        ]
      },
      {
        "name": "PatchText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "PatchTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "encoding",
            "type": "String"
          }
        ]
      },
      {
        "name": "PostFile",
        "parameters": [
          {
            "name": "path",
            "type": "String"
          }
        ]
      },
      {
        "name": "PostText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "PostTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "encoding",
            "type": "String"
          }
        ]
      },
      {
        "name": "PutFile",
        "parameters": [
          {
            "name": "path",
            "type": "String"
          }
        ]
      },
      {
        "name": "PutText",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "PutTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "encoding",
            "type": "String"
          }
        ]
      },
      {
        "name": "UriDecode",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "UriEncode",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          }
        ]
      },
      {
        "name": "XMLTextDecode",
        "parameters": [
          {
            "name": "xmlText",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "AllowCookies",
        "type": "Any"
      },
      {
        "name": "RequestHeaders",
        "type": "Any"
      },
      {
        "name": "ResponseFileName",
        "type": "Any"
      },
      {
        "name": "ResponseTextEncoding",
        "type": "Any"
      },
      {
        "name": "SaveResponse",
        "type": "Any"
      },
      {
        "name": "Timeout",
        "type": "Any"
      },
      {
        "name": "Url",
        "type": "Any"
      }
    ]
  },
  "WebViewer": {
    "events": [
      {
        "name": "BeforePageLoad",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      },
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "errorCode",
            "type": "Number"
          },
          {
            "name": "description",
            "type": "String"
          },
          {
            "name": "failingUrl",
            "type": "String"
          }
        ]
      },
      {
        "name": "PageLoaded",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "CanGoBack",
        "parameters": []
      },
      {
        "name": "CanGoForward",
        "parameters": []
      },
      {
        "name": "ClearCaches",
        "parameters": []
      },
      {
        "name": "ClearCookies",
        "parameters": []
      },
      {
        "name": "ClearHistory",
        "parameters": []
      },
      {
        "name": "ClearLocations",
        "parameters": []
      },
      {
        "name": "FollowLinks",
        "parameters": []
      },
      {
        "name": "GoBack",
        "parameters": []
      },
      {
        "name": "GoForward",
        "parameters": []
      },
      {
        "name": "GoHome",
        "parameters": []
      },
      {
        "name": "GoToUrl",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      },
      {
        "name": "Reload",
        "parameters": []
      },
      {
        "name": "RunJavaScript",
        "parameters": [
          {
            "name": "js",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetWebViewString",
        "parameters": [
          {
            "name": "webViewString",
            "type": "String"
          }
        ]
      },
      {
        "name": "StopLoading",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "CurrentPageTitle",
        "type": "Any"
      },
      {
        "name": "CurrentUrl",
        "type": "Any"
      },
      {
        "name": "FollowLinks",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "HomeUrl",
        "type": "Any"
      },
      {
        "name": "IgnoreSslErrors",
        "type": "Any"
      },
      {
        "name": "PromptForPermission",
        "type": "Any"
      },
      {
        "name": "UsesLocation",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "WebViewString",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "WifiClient": {
    "events": [],
    "methods": [
      {
        "name": "CheckWifiStatus",
        "parameters": []
      },
      {
        "name": "ConnectToNetwork",
        "parameters": [
          {
            "name": "networkSSID",
            "type": "String"
          },
          {
            "name": "networkPassword",
            "type": "String"
          }
        ]
      },
      {
        "name": "DisconnectFromNetwork",
        "parameters": []
      },
      {
        "name": "GetSSID",
        "parameters": []
      },
      {
        "name": "IPAddress",
        "parameters": []
      },
      {
        "name": "IsConnected",
        "parameters": []
      },
      {
        "name": "ScanAPAccessPoints",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      }
    ]
  }
};
