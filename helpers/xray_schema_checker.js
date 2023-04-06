const validate = require('jsonschema').validate;
const process = require('process');

//Xray schema from https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
const xray_import_schema = {
    "$id": "XraySchema",
    "type": "object",
    "properties": {
        "testExecutionKey": {
            "type": "string"
        },
        "info": {
            "type": "object",
            "properties": {
                "project": {
                    "type": "string"
                },
                "summary": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "version": {
                    "type": "string"
                },
                "revision": {
                    "type": "string"
                },
                "user": {
                    "type": "string"
                },
                "startDate": {
                    "type": "string",
                    "format": "date-time"
                },
                "finishDate": {
                    "type": "string",
                    "format": "date-time"
                },
                "testPlanKey": {
                    "type": "string"
                },
                "testEnvironments": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "additionalProperties": false
        },
        "tests": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/Test"
            },
            "minItems": 1
        }
    },
    "additionalProperties": false,
    "definitions": {
        "Test": {
            "type": "object",
            "properties": {
                "testKey": {
                    "type": "string"
                },
                "testInfo": {
                    "$ref": "#/definitions/TestInfo"
                },
                "start": {
                    "type": "string",
                    "format": "date-time"
                },
                "finish": {
                    "type": "string",
                    "format": "date-time"
                },
                "comment": {
                    "type": "string"
                },
                "executedBy": {
                    "type": "string"
                },
                "assignee": {
                    "type": "string"
                },
                "status": {
                    "type": "string"
                },
                "steps": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/ManualTestStepResult"
                    }
                },
                "examples": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "TODO",
                            "FAILED",
                            "PASSED",
                            "EXECUTING"
                        ]
                    }
                },
                "iterations": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/IterationResult"
                    }
                },
                "defects": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "evidence": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/EvidenceItem"
                    }
                },
                "evidences": {/* DEPRECATED*/
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/EvidenceItem"
                    }
                },
                "customFields": {
                    "$ref": "#/definitions/CustomField"
                }
            },
            "required": [
                "status"
            ],
            "dependencies": {
                "evidence": {
                    "not": {
                        "required": [
                            "evidences"
                        ]
                    }
                },
                "evidences": {
                    "not": {
                        "required": [
                            "evidence"
                        ]
                    }
                },
                "steps": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "examples"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "iterations"
                                ]
                            }
                        }
                    ]
                },
                "examples": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "steps"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "iterations"
                                ]
                            }
                        }
                    ]
                },
                "iterations": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "steps"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "examples"
                                ]
                            }
                        }
                    ]
                }
            },
            "additionalProperties": false
        },
        "IterationResult": {
            "type": "object",
            "properties": {
                "parameters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "value": {
                                "type": "string"
                            }
                        },
                        "additionalProperties": false
                    }
                },
                "name": {
                    "type": "string"
                },
                "log": {
                    "type": "string"
                },
                "status": {
                    "type": "string"
                },
                "steps": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/ManualTestStepResult"
                    }
                }
            },
            "required": [
                "status"
            ],
            "additionalProperties": false
        },
        "ManualTestStepResult": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string"
                },
                "comment": {
                    "type": "string"
                },
                "evidences": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/EvidenceItem"
                    }
                },
                "defects": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "actualResult": {
                    "type": "string"
                }
            },
            "required": [
                "status"
            ],
            "additionalProperties": false
        },
        "TestInfo": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "projectKey": {
                    "type": "string"
                },
                "requirementKeys": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "labels": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "type": {
                    "type": "string"
                },
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string"
                            },
                            "data": {
                                "type": "string"
                            },
                            "result": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "action"
                        ],
                        "additionalProperties": false
                    }
                },
                "scenario": {
                    "type": "string"
                },
                "scenarioType": {
                    "type": "string"
                },
                "definition": {
                    "type": "string"
                }
            },
            "dependencies": {
                "steps": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "scenario"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "definition"
                                ]
                            }
                        }
                    ]
                },
                "scenario": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "steps"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "definition"
                                ]
                            }
                        }
                    ]
                },
                "definition": {
                    "allOf": [
                        {
                            "not": {
                                "required": [
                                    "steps"
                                ]
                            }
                        },
                        {
                            "not": {
                                "required": [
                                    "scenario"
                                ]
                            }
                        }
                    ]
                }
            },
            "required": [
                "summary",
                "projectKey",
                "type"
            ],
            "additionalProperties": false
        },
        "EvidenceItem": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "string"
                },
                "filename": {
                    "type": "string"
                },
                "contentType": {
                    "type": "string"
                }
            },
            "required": [
                "data",
                "filename"
            ],
            "additionalProperties": false
        },
        "CustomField": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "value": {}
                },
                "required": [
                    "id",
                    "value"
                ],
                "additionalProperties": false
            }
        }
    }
};

const xray_schema_checker = () => ({

    validate : (import_execution_data) => {
        const result = validate(import_execution_data, xray_import_schema);
        if (result.errors.length > 0) {
            console.error(`Error in xray execute import body, please refer to the developer. \nReason : \n`, result.errors);
            process.exit(1);
        }
    }
});

module.exports = xray_schema_checker();
