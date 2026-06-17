/**
 * Auto-generated from component definitions.
 * Source: appinventor-sources-ref/appinventor/components/.../runtime/*.java
 */
export const GENERATED_COMPONENT_METADATA = {
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
          },
          {
            "name": "useBrake",
            "type": "Boolean"
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
            "name": "milliseconds",
            "type": "Number"
          },
          {
            "name": "useBrake",
            "type": "Boolean"
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
          },
          {
            "name": "useBrake",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "RotateSyncIndefinitely",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "turnRatio",
            "type": "Number"
          }
        ]
      },
      {
        "name": "RotateSyncInDistance",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "distance",
            "type": "Number"
          },
          {
            "name": "turnRatio",
            "type": "Number"
          },
          {
            "name": "useBrake",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "RotateSyncInDuration",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "milliseconds",
            "type": "Number"
          },
          {
            "name": "turnRatio",
            "type": "Number"
          },
          {
            "name": "useBrake",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "RotateSyncInTachoCounts",
        "parameters": [
          {
            "name": "power",
            "type": "Number"
          },
          {
            "name": "tachoCounts",
            "type": "Number"
          },
          {
            "name": "turnRatio",
            "type": "Number"
          },
          {
            "name": "useBrake",
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
        "name": "EnableSpeedRegulation",
        "type": "Any"
      },
      {
        "name": "MotorPorts",
        "type": "Any"
      },
      {
        "name": "ReverseDirection",
        "type": "Any"
      },
      {
        "name": "StopBeforeDisconnect",
        "type": "Any"
      },
      {
        "name": "TachoCountChangedEventEnabled",
        "type": "Any"
      },
      {
        "name": "WheelDiameter",
        "type": "Any"
      }
    ]
  },
  "Ev3Sound": {
    "events": [],
    "methods": [
      {
        "name": "PlayTone",
        "parameters": [
          {
            "name": "volume",
            "type": "Number"
          },
          {
            "name": "frequency",
            "type": "Number"
          },
          {
            "name": "milliseconds",
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
            "name": "color",
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
            "name": "color",
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
            "name": "type",
            "type": "Number"
          },
          {
            "name": "no",
            "type": "Number"
          }
        ]
      },
      {
        "name": "DrawLine",
        "parameters": [
          {
            "name": "color",
            "type": "Number"
          },
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
            "name": "color",
            "type": "Number"
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
        "name": "DrawRect",
        "parameters": [
          {
            "name": "color",
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
            "name": "width",
            "type": "Number"
          },
          {
            "name": "height",
            "type": "Number"
          },
          {
            "name": "fill",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "FillScreen",
        "parameters": [
          {
            "name": "color",
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
      },
      {
        "name": "SetCmUnit",
        "parameters": []
      },
      {
        "name": "SetInchUnit",
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
    "events": [
      {
        "name": "GotFeatures",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          },
          {
            "name": "features",
            "type": "List"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "FeaturesFromGeoJSON",
        "type": "Any"
      },
      {
        "name": "Source",
        "type": "Any"
      },
      {
        "name": "Visible",
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
        "name": "call",
        "parameters": [
          {
            "name": "files",
            "type": "Any"
          }
        ]
      },
      {
        "name": "call",
        "parameters": [
          {
            "name": "files",
            "type": "Any"
          }
        ]
      },
      {
        "name": "call",
        "parameters": [
          {
            "name": "files",
            "type": "Any"
          }
        ]
      },
      {
        "name": "call",
        "parameters": [
          {
            "name": "files",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Delete",
        "parameters": [
          {
            "name": "fileName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Exists",
        "parameters": [
          {
            "name": "scope",
            "type": "Any"
          },
          {
            "name": "path",
            "type": "String"
          },
          {
            "name": "continuation",
            "type": "Any"
          }
        ]
      },
      {
        "name": "IsDirectory",
        "parameters": [
          {
            "name": "scope",
            "type": "Any"
          },
          {
            "name": "path",
            "type": "String"
          },
          {
            "name": "continuation",
            "type": "Any"
          }
        ]
      },
      {
        "name": "MakeFullPath",
        "parameters": [
          {
            "name": "scope",
            "type": "Any"
          },
          {
            "name": "path",
            "type": "String"
          }
        ]
      },
      {
        "name": "processFile",
        "parameters": [
          {
            "name": "scopedFile",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ReadFrom",
        "parameters": [
          {
            "name": "fileName",
            "type": "Any"
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
    "properties": [
      {
        "name": "ReadPermission",
        "type": "Any"
      },
      {
        "name": "Scope",
        "type": "Any"
      },
      {
        "name": "WritePermission",
        "type": "Any"
      }
    ]
  },
  "FileBase": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "DefaultScope",
        "type": "Any"
      },
      {
        "name": "LegacyMode",
        "type": "Any"
      }
    ]
  },
  "FilePicker": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Action",
        "type": "Any"
      },
      {
        "name": "MimeType",
        "type": "Any"
      },
      {
        "name": "Selection",
        "type": "Any"
      }
    ]
  },
  "FirebaseDB": {
    "events": [
      {
        "name": "DataChanged",
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
        "name": "FirebaseError",
        "parameters": [
          {
            "name": "message",
            "type": "String"
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
      }
    ],
    "methods": [
      {
        "name": "AppendValue",
        "parameters": [
          {
            "name": "tag",
            "type": "Any"
          },
          {
            "name": "valueToAdd",
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
        "name": "RemoveFirst",
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
        "name": "DeveloperBucket",
        "type": "Any"
      },
      {
        "name": "FirebaseToken",
        "type": "Any"
      },
      {
        "name": "FirebaseURL",
        "type": "Any"
      },
      {
        "name": "Persist",
        "type": "Any"
      },
      {
        "name": "ProjectBucket",
        "type": "Any"
      }
    ]
  },
  "Form": {
    "events": [
      {
        "name": "BackPressed",
        "parameters": []
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
        "name": "PermissionGranted",
        "parameters": []
      },
      {
        "name": "run",
        "parameters": []
      },
      {
        "name": "ScreenOrientationChanged",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "AskForPermission",
        "parameters": []
      },
      {
        "name": "HideKeyboard",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboutScreen",
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
        "name": "BigDefaultText",
        "type": "Any"
      },
      {
        "name": "BlocksToolkit",
        "type": "Any"
      },
      {
        "name": "CloseScreenAnimation",
        "type": "Any"
      },
      {
        "name": "DefaultFileScope",
        "type": "Any"
      },
      {
        "name": "Height",
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
        "name": "NSBluetoothAlwaysUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSBluetoothPeripheralUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSCameraUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSContactsUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSLocationWhenInUseUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSMicrophoneUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSSpeechRecognitionUsageDescription",
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
      },
      {
        "name": "Width",
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
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "DoQuery",
        "parameters": []
      },
      {
        "name": "ForgetLogin",
        "parameters": []
      },
      {
        "name": "GetRows",
        "parameters": [
          {
            "name": "tableId",
            "type": "String"
          },
          {
            "name": "columns",
            "type": "String"
          }
        ]
      },
      {
        "name": "GetRowsWithConditions",
        "parameters": [
          {
            "name": "tableId",
            "type": "String"
          },
          {
            "name": "columns",
            "type": "String"
          },
          {
            "name": "conditions",
            "type": "String"
          }
        ]
      },
      {
        "name": "InsertRow",
        "parameters": [
          {
            "name": "tableId",
            "type": "String"
          },
          {
            "name": "columns",
            "type": "String"
          },
          {
            "name": "values",
            "type": "String"
          }
        ]
      },
      {
        "name": "SendQuery",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      },
      {
        "name": "KeyFile",
        "type": "Any"
      },
      {
        "name": "LoadingDialogMessage",
        "type": "Any"
      },
      {
        "name": "Query",
        "type": "Any"
      },
      {
        "name": "ServiceAccountEmail",
        "type": "Any"
      },
      {
        "name": "ShowLoadingDialog",
        "type": "Any"
      },
      {
        "name": "UseServiceAuthentication",
        "type": "Any"
      }
    ]
  },
  "GameClient": {
    "events": [
      {
        "name": "FunctionCompleted",
        "parameters": [
          {
            "name": "functionName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotMessage",
        "parameters": [
          {
            "name": "type",
            "type": "Any"
          },
          {
            "name": "sender",
            "type": "Any"
          },
          {
            "name": "contents",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Info",
        "parameters": [
          {
            "name": "message",
            "type": "Any"
          }
        ]
      },
      {
        "name": "InstanceIdChanged",
        "parameters": [
          {
            "name": "instanceId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Invited",
        "parameters": [
          {
            "name": "instanceId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "NewInstanceMade",
        "parameters": [
          {
            "name": "instanceId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "NewLeader",
        "parameters": [
          {
            "name": "playerId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PlayerJoined",
        "parameters": [
          {
            "name": "playerId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PlayerLeft",
        "parameters": [
          {
            "name": "playerId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ServerCommandFailure",
        "parameters": [
          {
            "name": "command",
            "type": "Any"
          },
          {
            "name": "arguments",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ServerCommandSuccess",
        "parameters": [
          {
            "name": "command",
            "type": "Any"
          },
          {
            "name": "response",
            "type": "Any"
          }
        ]
      },
      {
        "name": "UserEmailAddressSet",
        "parameters": [
          {
            "name": "emailAddress",
            "type": "Any"
          }
        ]
      },
      {
        "name": "WebServiceError",
        "parameters": [
          {
            "name": "functionName",
            "type": "Any"
          },
          {
            "name": "message",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "GetInstanceLists",
        "parameters": []
      },
      {
        "name": "GetMessages",
        "parameters": [
          {
            "name": "type",
            "type": "Any"
          },
          {
            "name": "count",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Invite",
        "parameters": [
          {
            "name": "playerEmail",
            "type": "Any"
          }
        ]
      },
      {
        "name": "LeaveInstance",
        "parameters": []
      },
      {
        "name": "MakeNewInstance",
        "parameters": [
          {
            "name": "instanceId",
            "type": "Any"
          },
          {
            "name": "makePublic",
            "type": "Any"
          }
        ]
      },
      {
        "name": "SendMessage",
        "parameters": [
          {
            "name": "type",
            "type": "Any"
          },
          {
            "name": "recipients",
            "type": "Any"
          },
          {
            "name": "contents",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ServerCommand",
        "parameters": [
          {
            "name": "command",
            "type": "Any"
          },
          {
            "name": "arguments",
            "type": "Any"
          }
        ]
      },
      {
        "name": "SetInstance",
        "parameters": [
          {
            "name": "instanceId",
            "type": "Any"
          }
        ]
      },
      {
        "name": "SetLeader",
        "parameters": [
          {
            "name": "playerEmail",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "GameId",
        "type": "Any"
      },
      {
        "name": "InstanceId",
        "type": "Any"
      },
      {
        "name": "InvitedInstances",
        "type": "Any"
      },
      {
        "name": "JoinedInstances",
        "type": "Any"
      },
      {
        "name": "Leader",
        "type": "Any"
      },
      {
        "name": "Players",
        "type": "Any"
      },
      {
        "name": "PublicInstances",
        "type": "Any"
      },
      {
        "name": "ServiceURL",
        "type": "Any"
      },
      {
        "name": "ServiceUrl",
        "type": "Any"
      },
      {
        "name": "UserEmailAddress",
        "type": "Any"
      }
    ]
  },
  "GyroscopeSensor": {
    "events": [],
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
        "name": "AlignHorizontalAbstract",
        "type": "Any"
      },
      {
        "name": "AlignVertical",
        "type": "Any"
      },
      {
        "name": "AlignVerticalAbstract",
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
    "events": [
      {
        "name": "Click",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "AlternateText",
        "type": "Any"
      },
      {
        "name": "Animation",
        "type": "Any"
      },
      {
        "name": "Clickable",
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
        "name": "Scaling",
        "type": "Any"
      }
    ]
  },
  "ImageBot": {
    "events": [
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "responseCode",
            "type": "Number"
          },
          {
            "name": "responseText",
            "type": "String"
          }
        ]
      },
      {
        "name": "ImageCreated",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      },
      {
        "name": "ImageEdited",
        "parameters": [
          {
            "name": "fileName",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
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
        "name": "EditImage",
        "parameters": [
          {
            "name": "source",
            "type": "Any"
          },
          {
            "name": "description",
            "type": "Any"
          }
        ]
      },
      {
        "name": "EditImageWithMask",
        "parameters": [
          {
            "name": "imageSource",
            "type": "Any"
          },
          {
            "name": "maskSource",
            "type": "Any"
          },
          {
            "name": "prompt",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      },
      {
        "name": "InvertMask",
        "type": "Any"
      },
      {
        "name": "Size",
        "type": "Any"
      },
      {
        "name": "Token",
        "type": "Any"
      }
    ]
  },
  "ImagePicker": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Selection",
        "type": "Any"
      }
    ]
  },
  "ImageSprite": {
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
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "MarkOrigin",
        "type": "Any"
      },
      {
        "name": "OriginX",
        "type": "Any"
      },
      {
        "name": "OriginY",
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
      }
    ]
  },
  "Label": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "BackgroundColor",
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
        "name": "HTMLContent",
        "type": "Any"
      },
      {
        "name": "HTMLFormat",
        "type": "Any"
      },
      {
        "name": "HasMargins",
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
            "name": "lux",
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
        "name": "Lux",
        "type": "Any"
      }
    ]
  },
  "LinearProgress": {
    "events": [
      {
        "name": "ProgressChanged",
        "parameters": [
          {
            "name": "progress",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "IncrementProgressBy",
        "parameters": [
          {
            "name": "value",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "Indeterminate",
        "type": "Any"
      },
      {
        "name": "IndeterminateColor",
        "type": "Any"
      },
      {
        "name": "Maximum",
        "type": "Any"
      },
      {
        "name": "Minimum",
        "type": "Any"
      },
      {
        "name": "Progress",
        "type": "Any"
      },
      {
        "name": "ProgressColor",
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
        "name": "StrokeWidth",
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
        "name": "Elements",
        "type": "Any"
      },
      {
        "name": "ElementsFromString",
        "type": "Any"
      },
      {
        "name": "ItemBackgroundColor",
        "type": "Any"
      },
      {
        "name": "ItemTextColor",
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
  "ListView": {
    "events": [
      {
        "name": "AfterPicking",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "AddItem",
        "parameters": [
          {
            "name": "mainText",
            "type": "String"
          },
          {
            "name": "detailText",
            "type": "String"
          },
          {
            "name": "imageName",
            "type": "String"
          }
        ]
      },
      {
        "name": "AddItemAtIndex",
        "parameters": [
          {
            "name": "index",
            "type": "Number"
          },
          {
            "name": "mainText",
            "type": "String"
          },
          {
            "name": "detailText",
            "type": "String"
          },
          {
            "name": "imageName",
            "type": "String"
          }
        ]
      },
      {
        "name": "AddItems",
        "parameters": [
          {
            "name": "itemsList",
            "type": "List"
          }
        ]
      },
      {
        "name": "AddItemsAtIndex",
        "parameters": [
          {
            "name": "index",
            "type": "Number"
          },
          {
            "name": "itemsList",
            "type": "List"
          }
        ]
      },
      {
        "name": "CreateElement",
        "parameters": [
          {
            "name": "mainText",
            "type": "Any"
          },
          {
            "name": "detailText",
            "type": "Any"
          },
          {
            "name": "imageName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetDetailText",
        "parameters": [
          {
            "name": "listElement",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetImageName",
        "parameters": [
          {
            "name": "listElement",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetMainText",
        "parameters": [
          {
            "name": "listElement",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Refresh",
        "parameters": []
      },
      {
        "name": "RemoveItemAtIndex",
        "parameters": [
          {
            "name": "index",
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
        "name": "BounceEdgeEffect",
        "type": "Any"
      },
      {
        "name": "DividerColor",
        "type": "Any"
      },
      {
        "name": "DividerThickness",
        "type": "Any"
      },
      {
        "name": "ElementColor",
        "type": "Any"
      },
      {
        "name": "ElementCornerRadius",
        "type": "Any"
      },
      {
        "name": "ElementMarginsWidth",
        "type": "Any"
      },
      {
        "name": "Elements",
        "type": "Any"
      },
      {
        "name": "ElementsFromString",
        "type": "Any"
      },
      {
        "name": "FontSize",
        "type": "Any"
      },
      {
        "name": "FontSizeDetail",
        "type": "Any"
      },
      {
        "name": "FontTypeface",
        "type": "Any"
      },
      {
        "name": "FontTypefaceDetail",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "HintText",
        "type": "Any"
      },
      {
        "name": "ImageHeight",
        "type": "Any"
      },
      {
        "name": "ImageWidth",
        "type": "Any"
      },
      {
        "name": "ListData",
        "type": "Any"
      },
      {
        "name": "ListViewLayout",
        "type": "Any"
      },
      {
        "name": "Orientation",
        "type": "Any"
      },
      {
        "name": "Selection",
        "type": "Any"
      },
      {
        "name": "SelectionColor",
        "type": "Any"
      },
      {
        "name": "SelectionDetailText",
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
        "name": "TextColor",
        "type": "Any"
      },
      {
        "name": "TextColorDetail",
        "type": "Any"
      },
      {
        "name": "TextSize",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "LocationSensor": {
    "events": [
      {
        "name": "GotAddress",
        "parameters": [
          {
            "name": "address",
            "type": "String"
          }
        ]
      },
      {
        "name": "GotLocationFromAddress",
        "parameters": [
          {
            "name": "address",
            "type": "String"
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
    "methods": [
      {
        "name": "Geocode",
        "parameters": [
          {
            "name": "address",
            "type": "Any"
          }
        ]
      },
      {
        "name": "LatitudeFromAddress",
        "parameters": [
          {
            "name": "locationName",
            "type": "String"
          }
        ]
      },
      {
        "name": "LongitudeFromAddress",
        "parameters": [
          {
            "name": "locationName",
            "type": "String"
          }
        ]
      },
      {
        "name": "ReverseGeocode",
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
        "name": "Accuracy",
        "type": "Any"
      },
      {
        "name": "Altitude",
        "type": "Any"
      },
      {
        "name": "AvailableProviders",
        "type": "Any"
      },
      {
        "name": "CurrentAddress",
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
        "name": "ProviderLocked",
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
  "MagneticFieldSensor": {
    "events": [
      {
        "name": "MagneticChanged",
        "parameters": [
          {
            "name": "xStrength",
            "type": "Number"
          },
          {
            "name": "yStrength",
            "type": "Number"
          },
          {
            "name": "zStrength",
            "type": "Number"
          },
          {
            "name": "absoluteStrength",
            "type": "Number"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "AbsoluteStrength",
        "type": "Any"
      },
      {
        "name": "Available",
        "type": "Any"
      },
      {
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "MaximumRange",
        "type": "Any"
      },
      {
        "name": "XStrength",
        "type": "Any"
      },
      {
        "name": "YStrength",
        "type": "Any"
      },
      {
        "name": "ZStrength",
        "type": "Any"
      }
    ]
  },
  "Map": {
    "events": [
      {
        "name": "BoundsChange",
        "parameters": []
      },
      {
        "name": "DoubleTapAtPoint",
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
        "name": "InvalidPoint",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "LongPressAtPoint",
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
        "name": "TapAtPoint",
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
        "name": "ZoomChange",
        "parameters": []
      }
    ],
    "methods": [
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
        "name": "PanTo",
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
            "name": "zoom",
            "type": "Number"
          }
        ]
      },
      {
        "name": "Save",
        "parameters": [
          {
            "name": "path",
            "type": "Any"
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
        "name": "CustomUrl",
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
        "name": "Features",
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
        "name": "MapTypeAbstract",
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
        "name": "ScaleUnitsAbstract",
        "type": "Any"
      },
      {
        "name": "ShowCompass",
        "type": "Any"
      },
      {
        "name": "ShowScale",
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
    "events": [],
    "methods": [
      {
        "name": "BearingToFeature",
        "parameters": [
          {
            "name": "mapFeature",
            "type": "Any"
          },
          {
            "name": "centroids",
            "type": "Any"
          }
        ]
      },
      {
        "name": "BearingToPoint",
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
        "name": "DistanceToPoint",
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
        "name": "AnchorHorizontal",
        "type": "Any"
      },
      {
        "name": "AnchorHorizontalAbstract",
        "type": "Any"
      },
      {
        "name": "AnchorVertical",
        "type": "Any"
      },
      {
        "name": "AnchorVerticalAbstract",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "HeightPercent",
        "type": "Any"
      },
      {
        "name": "ImageAsset",
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
        "name": "TypeAbstract",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      },
      {
        "name": "WidthPercent",
        "type": "Any"
      }
    ]
  },
  "MediaStore": {
    "events": [
      {
        "name": "MediaStored",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      },
      {
        "name": "WebServiceError",
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
        "name": "PostMedia",
        "parameters": [
          {
            "name": "mediafile",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ServiceURL",
        "type": "Any"
      }
    ]
  },
  "Navigation": {
    "events": [
      {
        "name": "run",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "RequestDirections",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      },
      {
        "name": "EndLatitude",
        "type": "Any"
      },
      {
        "name": "EndLocation",
        "type": "Any"
      },
      {
        "name": "EndLongitude",
        "type": "Any"
      },
      {
        "name": "Language",
        "type": "Any"
      },
      {
        "name": "ResponseContent",
        "type": "Any"
      },
      {
        "name": "ServiceURL",
        "type": "Any"
      },
      {
        "name": "StartLatitude",
        "type": "Any"
      },
      {
        "name": "StartLocation",
        "type": "Any"
      },
      {
        "name": "StartLongitude",
        "type": "Any"
      },
      {
        "name": "TransportationMethod",
        "type": "Any"
      },
      {
        "name": "TransportationMethodAbstract",
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
      },
      {
        "name": "TagWritten",
        "parameters": []
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
  "Notifier": {
    "events": [
      {
        "name": "AfterChoosing",
        "parameters": [
          {
            "name": "choice",
            "type": "String"
          }
        ]
      },
      {
        "name": "AfterTextInput",
        "parameters": [
          {
            "name": "response",
            "type": "String"
          }
        ]
      },
      {
        "name": "ChoosingCanceled",
        "parameters": []
      },
      {
        "name": "TextInputCanceled",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "DismissProgressDialog",
        "parameters": []
      },
      {
        "name": "LogError",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "LogInfo",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "LogWarning",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          }
        ]
      },
      {
        "name": "run",
        "parameters": []
      },
      {
        "name": "ShowAlert",
        "parameters": [
          {
            "name": "notice",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ShowMessageDialog",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          },
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "buttonText",
            "type": "String"
          }
        ]
      },
      {
        "name": "ShowPasswordDialog",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          },
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "cancelable",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "ShowProgressDialog",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          },
          {
            "name": "title",
            "type": "String"
          }
        ]
      },
      {
        "name": "ShowTextDialog",
        "parameters": [
          {
            "name": "message",
            "type": "String"
          },
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "cancelable",
            "type": "Boolean"
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
        "name": "NotifierLength",
        "type": "Any"
      },
      {
        "name": "TextColor",
        "type": "Any"
      }
    ]
  },
  "NxtColorSensor": {
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
            "name": "color",
            "type": "Number"
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
        "name": "GetColor",
        "parameters": []
      },
      {
        "name": "GetLightLevel",
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
        "name": "SensorPort",
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
        "name": "GetInputValues",
        "parameters": []
      },
      {
        "name": "GetOutputState",
        "parameters": []
      },
      {
        "name": "KeepAlive",
        "parameters": []
      },
      {
        "name": "ListFiles",
        "parameters": [
          {
            "name": "wildcard",
            "type": "String"
          }
        ]
      },
      {
        "name": "LsGetStatus",
        "parameters": []
      },
      {
        "name": "LsRead",
        "parameters": []
      },
      {
        "name": "MessageRead",
        "parameters": []
      },
      {
        "name": "MessageWrite",
        "parameters": []
      },
      {
        "name": "PlaySoundFile",
        "parameters": [
          {
            "name": "fileName",
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
        "parameters": []
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
      },
      {
        "name": "StopSoundPlayback",
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
          },
          {
            "name": "distance",
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
          },
          {
            "name": "distance",
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
        "parameters": []
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
    "properties": [
      {
        "name": "DriveMotors",
        "type": "Any"
      },
      {
        "name": "StopBeforeDisconnect",
        "type": "Any"
      },
      {
        "name": "WheelDiameter",
        "type": "Any"
      }
    ]
  },
  "NxtLightSensor": {
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
        "name": "GetLightLevel",
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
        "name": "GenerateLight",
        "type": "Any"
      },
      {
        "name": "SensorPort",
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
        "name": "GetSoundLevel",
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
        "name": "SensorPort",
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
      },
      {
        "name": "SensorPort",
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
        "name": "SensorPort",
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
        "name": "Enabled",
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
        "name": "NumbersOnly",
        "type": "Any"
      },
      {
        "name": "PasswordVisible",
        "type": "Any"
      }
    ]
  },
  "Pedometer": {
    "events": [
      {
        "name": "CalibrationFailed",
        "parameters": []
      },
      {
        "name": "GPSAvailable",
        "parameters": []
      },
      {
        "name": "GPSLost",
        "parameters": []
      },
      {
        "name": "SimpleStep",
        "parameters": [
          {
            "name": "simpleSteps",
            "type": "Number"
          },
          {
            "name": "distance",
            "type": "Number"
          }
        ]
      },
      {
        "name": "StartedMoving",
        "parameters": []
      },
      {
        "name": "StoppedMoving",
        "parameters": []
      },
      {
        "name": "WalkStep",
        "parameters": [
          {
            "name": "walkSteps",
            "type": "Number"
          },
          {
            "name": "distance",
            "type": "Number"
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
        "name": "Reset",
        "parameters": []
      },
      {
        "name": "Resume",
        "parameters": []
      },
      {
        "name": "Save",
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
        "name": "CalibrateStrideLength",
        "type": "Any"
      },
      {
        "name": "Distance",
        "type": "Any"
      },
      {
        "name": "ElapsedTime",
        "type": "Any"
      },
      {
        "name": "Moving",
        "type": "Any"
      },
      {
        "name": "SimpleSteps",
        "type": "Any"
      },
      {
        "name": "StopDetectionTimeout",
        "type": "Any"
      },
      {
        "name": "StrideLength",
        "type": "Any"
      },
      {
        "name": "UseGPS",
        "type": "Any"
      },
      {
        "name": "WalkSteps",
        "type": "Any"
      }
    ]
  },
  "PhoneCall": {
    "events": [
      {
        "name": "IncomingCallAnswered",
        "parameters": [
          {
            "name": "phoneNumber",
            "type": "String"
          }
        ]
      },
      {
        "name": "PhoneCallEnded",
        "parameters": []
      },
      {
        "name": "PhoneCallStarted",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "MakePhoneCall",
        "parameters": []
      },
      {
        "name": "MakePhoneCallDirect",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "PhoneNumber",
        "type": "Any"
      }
    ]
  },
  "PhoneNumberPicker": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "PhoneNumber",
        "type": "Any"
      }
    ]
  },
  "PhoneStatus": {
    "events": [
      {
        "name": "OnSettings",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "GetInstaller",
        "parameters": []
      },
      {
        "name": "GetVersionName",
        "parameters": []
      },
      {
        "name": "InstallationId",
        "parameters": []
      },
      {
        "name": "installURL",
        "parameters": [
          {
            "name": "url",
            "type": "String"
          }
        ]
      },
      {
        "name": "isDirect",
        "parameters": []
      },
      {
        "name": "run",
        "parameters": []
      },
      {
        "name": "SdkLevel",
        "parameters": []
      },
      {
        "name": "setAssetsLoaded",
        "parameters": []
      },
      {
        "name": "setHmacSeedReturnCode",
        "parameters": [
          {
            "name": "seed",
            "type": "String"
          },
          {
            "name": "rendezvousServer",
            "type": "String"
          }
        ]
      },
      {
        "name": "SetPopup",
        "parameters": [
          {
            "name": "page",
            "type": "String"
          }
        ]
      },
      {
        "name": "shutdown",
        "parameters": []
      },
      {
        "name": "startHTTPD",
        "parameters": [
          {
            "name": "secure",
            "type": "Boolean"
          }
        ]
      },
      {
        "name": "startWebRTC",
        "parameters": [
          {
            "name": "rendezvousServer",
            "type": "String"
          },
          {
            "name": "iceServers",
            "type": "String"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "WebRTC",
        "type": "Any"
      }
    ]
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
        "name": "Vibrate",
        "parameters": [
          {
            "name": "milliseconds",
            "type": "Number"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "IsPlaying",
        "type": "Any"
      },
      {
        "name": "Loop",
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
        "name": "Centroid",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "HolePoints",
        "type": "Any"
      },
      {
        "name": "HolePointsFromString",
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
        "name": "Enabled",
        "type": "Any"
      },
      {
        "name": "KeepRunningWhenOnPause",
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
        "name": "Bounds",
        "parameters": []
      },
      {
        "name": "Center",
        "parameters": []
      },
      {
        "name": "SetCenter",
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
        "name": "EastLongitude",
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
        "name": "TypeAbstract",
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
  "ReplForm": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Theme",
        "type": "Any"
      }
    ]
  },
  "Screen": {
    "events": [
      {
        "name": "BackPressed",
        "parameters": []
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
        "name": "PermissionGranted",
        "parameters": []
      },
      {
        "name": "run",
        "parameters": []
      },
      {
        "name": "ScreenOrientationChanged",
        "parameters": []
      }
    ],
    "methods": [
      {
        "name": "AskForPermission",
        "parameters": []
      },
      {
        "name": "HideKeyboard",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AboutScreen",
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
        "name": "BigDefaultText",
        "type": "Any"
      },
      {
        "name": "BlocksToolkit",
        "type": "Any"
      },
      {
        "name": "CloseScreenAnimation",
        "type": "Any"
      },
      {
        "name": "DefaultFileScope",
        "type": "Any"
      },
      {
        "name": "Height",
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
        "name": "NSBluetoothAlwaysUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSBluetoothPeripheralUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSCameraUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSContactsUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSLocationWhenInUseUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSMicrophoneUsageDescription",
        "type": "Any"
      },
      {
        "name": "NSSpeechRecognitionUsageDescription",
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
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "Serial": {
    "events": [],
    "methods": [
      {
        "name": "CloseSerial",
        "parameters": []
      },
      {
        "name": "InitializeSerial",
        "parameters": []
      },
      {
        "name": "OpenSerial",
        "parameters": []
      },
      {
        "name": "PrintSerial",
        "parameters": [
          {
            "name": "data",
            "type": "String"
          }
        ]
      },
      {
        "name": "ReadSerial",
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
        "name": "IsInitialized",
        "type": "Any"
      },
      {
        "name": "IsOpen",
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
            "name": "file",
            "type": "String"
          }
        ]
      },
      {
        "name": "ShareFileWithMessage",
        "parameters": [
          {
            "name": "file",
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
        "name": "RefreshTime",
        "type": "Any"
      }
    ]
  },
  "Slider": {
    "events": [
      {
        "name": "PositionChanged",
        "parameters": [
          {
            "name": "thumbPosition",
            "type": "Number"
          }
        ]
      },
      {
        "name": "TouchDown",
        "parameters": []
      },
      {
        "name": "TouchUp",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "ColorLeft",
        "type": "Any"
      },
      {
        "name": "ColorRight",
        "type": "Any"
      },
      {
        "name": "MaxValue",
        "type": "Any"
      },
      {
        "name": "MinValue",
        "type": "Any"
      },
      {
        "name": "NumberOfSteps",
        "type": "Any"
      },
      {
        "name": "ThumbColor",
        "type": "Any"
      },
      {
        "name": "ThumbEnabled",
        "type": "Any"
      },
      {
        "name": "ThumbPosition",
        "type": "Any"
      }
    ]
  },
  "Sound": {
    "events": [
      {
        "name": "SoundError",
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
            "name": "millisecs",
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
        "name": "Source",
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
            "type": "Any"
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
    "properties": [
      {
        "name": "SavedRecording",
        "type": "Any"
      }
    ]
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
            "name": "partial",
            "type": "Boolean"
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
    "events": [
      {
        "name": "AfterSelecting",
        "parameters": [
          {
            "name": "selection",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "DisplayDropdown",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "Elements",
        "type": "Any"
      },
      {
        "name": "ElementsFromString",
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
        "name": "HeightPercent",
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
      },
      {
        "name": "WidthPercent",
        "type": "Any"
      }
    ]
  },
  "Spreadsheet": {
    "events": [
      {
        "name": "ErrorOccurred",
        "parameters": [
          {
            "name": "errorMessage",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FinishedAddColumn",
        "parameters": [
          {
            "name": "columnNumber",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FinishedAddRow",
        "parameters": [
          {
            "name": "rowNumber",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FinishedAddSheet",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FinishedClearRange",
        "parameters": []
      },
      {
        "name": "FinishedDeleteSheet",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FinishedRemoveColumn",
        "parameters": []
      },
      {
        "name": "FinishedRemoveRow",
        "parameters": []
      },
      {
        "name": "FinishedWriteCell",
        "parameters": []
      },
      {
        "name": "FinishedWriteColumn",
        "parameters": []
      },
      {
        "name": "FinishedWriteRange",
        "parameters": []
      },
      {
        "name": "FinishedWriteRow",
        "parameters": []
      },
      {
        "name": "GotCellData",
        "parameters": [
          {
            "name": "cellData",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotColumnData",
        "parameters": [
          {
            "name": "columnData",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotFilterResult",
        "parameters": [
          {
            "name": "returnRows",
            "type": "List"
          },
          {
            "name": "returnData",
            "type": "List"
          }
        ]
      },
      {
        "name": "GotRangeData",
        "parameters": [
          {
            "name": "rangeData",
            "type": "List"
          }
        ]
      },
      {
        "name": "GotRowData",
        "parameters": [
          {
            "name": "rowDataList",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotSheetData",
        "parameters": [
          {
            "name": "sheetData",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GotSheetList",
        "parameters": [
          {
            "name": "sheetNames",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "AddColumn",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "data",
            "type": "List"
          }
        ]
      },
      {
        "name": "AddRow",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "data",
            "type": "List"
          }
        ]
      },
      {
        "name": "AddSheet",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ClearRange",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "rangeReference",
            "type": "String"
          }
        ]
      },
      {
        "name": "DeleteSheet",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetCellReference",
        "parameters": [
          {
            "name": "row",
            "type": "Number"
          },
          {
            "name": "column",
            "type": "Number"
          }
        ]
      },
      {
        "name": "GetRangeReference",
        "parameters": [
          {
            "name": "row1",
            "type": "Number"
          },
          {
            "name": "column1",
            "type": "Number"
          },
          {
            "name": "row2",
            "type": "Number"
          },
          {
            "name": "column2",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ListSheets",
        "parameters": []
      },
      {
        "name": "ReadCell",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "cellReference",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ReadColumn",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "column",
            "type": "String"
          }
        ]
      },
      {
        "name": "ReadRange",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "rangeReference",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ReadRow",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "rowNumber",
            "type": "Number"
          }
        ]
      },
      {
        "name": "ReadSheet",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ReadWithExactFilter",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "colID",
            "type": "Any"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ReadWithPartialFilter",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "colID",
            "type": "Any"
          },
          {
            "name": "value",
            "type": "Any"
          }
        ]
      },
      {
        "name": "RemoveColumn",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "column",
            "type": "Any"
          }
        ]
      },
      {
        "name": "RemoveRow",
        "parameters": [
          {
            "name": "sheetName",
            "type": "Any"
          },
          {
            "name": "rowNumber",
            "type": "Any"
          }
        ]
      },
      {
        "name": "WriteCell",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "cellReference",
            "type": "String"
          },
          {
            "name": "data",
            "type": "Any"
          }
        ]
      },
      {
        "name": "WriteColumn",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "column",
            "type": "String"
          },
          {
            "name": "data",
            "type": "List"
          }
        ]
      },
      {
        "name": "WriteRange",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "rangeReference",
            "type": "String"
          },
          {
            "name": "data",
            "type": "List"
          }
        ]
      },
      {
        "name": "WriteRow",
        "parameters": [
          {
            "name": "sheetName",
            "type": "String"
          },
          {
            "name": "rowNumber",
            "type": "Number"
          },
          {
            "name": "data",
            "type": "List"
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
        "name": "CredentialsJson",
        "type": "Any"
      },
      {
        "name": "SpreadsheetID",
        "type": "Any"
      }
    ]
  },
  "Switch": {
    "events": [
      {
        "name": "Changed",
        "parameters": []
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "On",
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
        "name": "TrackColorActive",
        "type": "Any"
      },
      {
        "name": "TrackColorInactive",
        "type": "Any"
      }
    ]
  },
  "TableArrangement": {
    "events": [],
    "methods": [],
    "properties": [
      {
        "name": "Columns",
        "type": "Any"
      },
      {
        "name": "Rows",
        "type": "Any"
      }
    ]
  },
  "TextBox": {
    "events": [],
    "methods": [
      {
        "name": "HideKeyboard",
        "parameters": []
      }
    ],
    "properties": [
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
      }
    ]
  },
  "TextBoxBase": {
    "events": [
      {
        "name": "GotFocus",
        "parameters": []
      },
      {
        "name": "LostFocus",
        "parameters": []
      },
      {
        "name": "TextChanged",
        "parameters": []
      },
      {
        "name": "Validate",
        "parameters": [
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "accept",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "MoveCursorTo",
        "parameters": [
          {
            "name": "position",
            "type": "Number"
          }
        ]
      },
      {
        "name": "MoveCursorToEnd",
        "parameters": []
      },
      {
        "name": "MoveCursorToStart",
        "parameters": []
      },
      {
        "name": "RequestFocus",
        "parameters": []
      }
    ],
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
        "name": "Hint",
        "type": "Any"
      },
      {
        "name": "HintColor",
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
  "Texting": {
    "events": [],
    "methods": [
      {
        "name": "SendMessage",
        "parameters": []
      },
      {
        "name": "SendMessageDirect",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "GoogleVoiceEnabled",
        "type": "Any"
      },
      {
        "name": "Message",
        "type": "Any"
      },
      {
        "name": "PhoneNumber",
        "type": "Any"
      },
      {
        "name": "ReceivingEnabled",
        "type": "Any"
      },
      {
        "name": "ReceivingEnabledAbstract",
        "type": "Any"
      }
    ]
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
            "type": "Any"
          }
        ]
      },
      {
        "name": "Stop",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "AvailableCountries",
        "type": "Any"
      },
      {
        "name": "AvailableLanguages",
        "type": "Any"
      },
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
        "name": "Result",
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
            "type": "Any"
          }
        ]
      },
      {
        "name": "GetEntries",
        "parameters": []
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
            "type": "Any"
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
        "name": "Namespace",
        "type": "Any"
      }
    ]
  },
  "TinyWebDB": {
    "events": [
      {
        "name": "GotValue",
        "parameters": [
          {
            "name": "tagFromWebDB",
            "type": "String"
          },
          {
            "name": "valueFromWebDB",
            "type": "Any"
          }
        ]
      },
      {
        "name": "ValueStored",
        "parameters": []
      },
      {
        "name": "WebServiceError",
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
        "name": "GetValue",
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
        "name": "ServiceURL",
        "type": "Any"
      }
    ]
  },
  "ToggleBase": {
    "events": [
      {
        "name": "Changed",
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
        "name": "TextColor",
        "type": "Any"
      }
    ]
  },
  "TouchComponent": {
    "events": [
      {
        "name": "TouchDown",
        "parameters": []
      },
      {
        "name": "TouchUp",
        "parameters": []
      }
    ],
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
        "name": "Image",
        "type": "Any"
      },
      {
        "name": "ShowFeedback",
        "type": "Any"
      }
    ]
  },
  "Translator": {
    "events": [
      {
        "name": "GotTranslation",
        "parameters": [
          {
            "name": "responseCode",
            "type": "Any"
          },
          {
            "name": "translation",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "run",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      }
    ]
  },
  "Trendline": {
    "events": [
      {
        "name": "Updated",
        "parameters": [
          {
            "name": "results",
            "type": "Dictionary"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "DisconnectFromChartData",
        "parameters": []
      },
      {
        "name": "GetResultValue",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "ChartData",
        "type": "Any"
      },
      {
        "name": "Color",
        "type": "Any"
      },
      {
        "name": "CorrelationCoefficient",
        "type": "Any"
      },
      {
        "name": "ExponentialBase",
        "type": "Any"
      },
      {
        "name": "ExponentialCoefficient",
        "type": "Any"
      },
      {
        "name": "Extend",
        "type": "Any"
      },
      {
        "name": "LinearCoefficient",
        "type": "Any"
      },
      {
        "name": "LogarithmCoefficient",
        "type": "Any"
      },
      {
        "name": "LogarithmConstant",
        "type": "Any"
      },
      {
        "name": "Model",
        "type": "Any"
      },
      {
        "name": "Predictions",
        "type": "Any"
      },
      {
        "name": "QuadraticCoefficient",
        "type": "Any"
      },
      {
        "name": "RSquared",
        "type": "Any"
      },
      {
        "name": "Results",
        "type": "Any"
      },
      {
        "name": "StrokeStyle",
        "type": "Any"
      },
      {
        "name": "StrokeWidth",
        "type": "Any"
      },
      {
        "name": "Visible",
        "type": "Any"
      },
      {
        "name": "XIntercepts",
        "type": "Any"
      },
      {
        "name": "YIntercept",
        "type": "Any"
      }
    ]
  },
  "Twitter": {
    "events": [
      {
        "name": "DirectMessagesReceived",
        "parameters": [
          {
            "name": "messages",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FollowersReceived",
        "parameters": [
          {
            "name": "followers2",
            "type": "Any"
          }
        ]
      },
      {
        "name": "FriendTimelineReceived",
        "parameters": [
          {
            "name": "timeline",
            "type": "Any"
          }
        ]
      },
      {
        "name": "IsAuthorized",
        "parameters": []
      },
      {
        "name": "MentionsReceived",
        "parameters": [
          {
            "name": "mentions",
            "type": "Any"
          }
        ]
      },
      {
        "name": "SearchSuccessful",
        "parameters": [
          {
            "name": "searchResults",
            "type": "Any"
          }
        ]
      }
    ],
    "methods": [
      {
        "name": "Authorize",
        "parameters": []
      },
      {
        "name": "CheckAuthorized",
        "parameters": []
      },
      {
        "name": "DeAuthorize",
        "parameters": []
      },
      {
        "name": "DirectMessage",
        "parameters": [
          {
            "name": "user",
            "type": "Any"
          },
          {
            "name": "message",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Follow",
        "parameters": [
          {
            "name": "user",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Login",
        "parameters": [
          {
            "name": "username",
            "type": "String"
          },
          {
            "name": "password",
            "type": "String"
          }
        ]
      },
      {
        "name": "RequestDirectMessages",
        "parameters": []
      },
      {
        "name": "RequestFollowers",
        "parameters": []
      },
      {
        "name": "RequestFriendTimeline",
        "parameters": []
      },
      {
        "name": "RequestMentions",
        "parameters": []
      },
      {
        "name": "SearchTwitter",
        "parameters": [
          {
            "name": "query",
            "type": "Any"
          }
        ]
      },
      {
        "name": "StopFollowing",
        "parameters": [
          {
            "name": "user",
            "type": "Any"
          }
        ]
      },
      {
        "name": "Tweet",
        "parameters": [
          {
            "name": "status",
            "type": "Any"
          }
        ]
      },
      {
        "name": "TweetWithImage",
        "parameters": [
          {
            "name": "status",
            "type": "Any"
          },
          {
            "name": "imagePath",
            "type": "Any"
          }
        ]
      }
    ],
    "properties": [
      {
        "name": "ConsumerKey",
        "type": "Any"
      },
      {
        "name": "ConsumerSecret",
        "type": "Any"
      },
      {
        "name": "DirectMessages",
        "type": "Any"
      },
      {
        "name": "Followers",
        "type": "Any"
      },
      {
        "name": "FriendTimeline",
        "type": "Any"
      },
      {
        "name": "Mentions",
        "type": "Any"
      },
      {
        "name": "SearchResults",
        "type": "Any"
      },
      {
        "name": "TwitPic_API_Key",
        "type": "Any"
      },
      {
        "name": "Username",
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
        "name": "VideoPlayerError",
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
        "name": "GetDuration",
        "parameters": []
      },
      {
        "name": "Pause",
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
        "name": "FullScreen",
        "type": "Any"
      },
      {
        "name": "Height",
        "type": "Any"
      },
      {
        "name": "Source",
        "type": "Any"
      },
      {
        "name": "Volume",
        "type": "Any"
      },
      {
        "name": "Width",
        "type": "Any"
      }
    ]
  },
  "Voting": {
    "events": [
      {
        "name": "GotBallot",
        "parameters": []
      },
      {
        "name": "GotBallotConfirmation",
        "parameters": []
      },
      {
        "name": "NoOpenPoll",
        "parameters": []
      },
      {
        "name": "WebServiceError",
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
        "name": "RequestBallot",
        "parameters": []
      },
      {
        "name": "SendBallot",
        "parameters": []
      }
    ],
    "properties": [
      {
        "name": "BallotOptions",
        "type": "Any"
      },
      {
        "name": "BallotQuestion",
        "type": "Any"
      },
      {
        "name": "ServiceURL",
        "type": "Any"
      },
      {
        "name": "UserChoice",
        "type": "Any"
      },
      {
        "name": "UserEmailAddress",
        "type": "Any"
      },
      {
        "name": "UserId",
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
            "type": "Any"
          }
        ]
      },
      {
        "name": "PatchText",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PatchTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          },
          {
            "name": "encoding",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PostFile",
        "parameters": [
          {
            "name": "path",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PostText",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PostTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          },
          {
            "name": "encoding",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PutFile",
        "parameters": [
          {
            "name": "path",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PutText",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          }
        ]
      },
      {
        "name": "PutTextWithEncoding",
        "parameters": [
          {
            "name": "text",
            "type": "Any"
          },
          {
            "name": "encoding",
            "type": "Any"
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
            "name": "XmlText",
            "type": "String"
          }
        ]
      },
      {
        "name": "XMLTextDecodeAsDictionary",
        "parameters": [
          {
            "name": "XmlText",
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
      },
      {
        "name": "WebViewStringChange",
        "parameters": [
          {
            "name": "value",
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
        "name": "ClearLocations",
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
        "name": "PromptforPermission",
        "type": "Any"
      },
      {
        "name": "UsesCamera",
        "type": "Any"
      },
      {
        "name": "UsesLocation",
        "type": "Any"
      },
      {
        "name": "UsesMicrophone",
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
  "YandexTranslate": {
    "events": [
      {
        "name": "GotTranslation",
        "parameters": [
          {
            "name": "responseCode",
            "type": "String"
          },
          {
            "name": "translation",
            "type": "String"
          }
        ]
      }
    ],
    "methods": [],
    "properties": [
      {
        "name": "ApiKey",
        "type": "Any"
      }
    ]
  }
};
