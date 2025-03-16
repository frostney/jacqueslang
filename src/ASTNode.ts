export interface ASTNode {
  type: string;
}

export interface ProgramNode extends ASTNode {
  type: "Program";
  body: ASTNode[];
}

export interface NumberLiteralNode extends ASTNode {
  type: "NumberLiteral";
  value: number;
}

export interface StringLiteralNode extends ASTNode {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteralNode extends ASTNode {
  type: "BooleanLiteral";
  value: boolean;
}

export interface IdentifierNode extends ASTNode {
  type: "Identifier";
  name: string;
  isShorthandProperty?: boolean;
  defaultValue?: ASTNode;
  typeAnnotation?: TypeNode;
}

export interface BinaryExpressionNode extends ASTNode {
  type: "BinaryExpression";
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpressionNode extends ASTNode {
  type: "UnaryExpression";
  operator: string;
  argument: ASTNode;
}

export interface AssignmentNode extends ASTNode {
  type: "Assignment";
  isConstant: boolean; // true for :=, false for =
  left: IdentifierNode | MemberExpressionNode;
  right: ASTNode;
}

export type ArrayLiteralNodeElement =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | ObjectLiteralNode
  | ArrayLiteralNode
  | CallExpressionNode;
export interface ArrayLiteralNode extends ASTNode {
  type: "ArrayLiteral";
  elements: ArrayLiteralNodeElement[];
}

export type ObjectLiteralNodePropertyValue =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | ObjectLiteralNode
  | ArrayLiteralNode
  | CallExpressionNode;
export interface ObjectLiteralNode extends ASTNode {
  type: "ObjectLiteral";
  properties: { key: string; value: ObjectLiteralNodePropertyValue }[];
}

export interface MemberExpressionNode extends ASTNode {
  type: "MemberExpression";
  object: ASTNode;
  property: ASTNode;
  computed: boolean; // true for obj[expr], false for obj.expr
}

export interface CallExpressionNode extends ASTNode {
  type: "CallExpression";
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface FunctionDeclarationNode extends ASTNode {
  type: "FunctionDeclaration";
  name: IdentifierNode | null;
  params: IdentifierNode[];
  body: ASTNode[];
}

export interface LambdaExpressionNode extends ASTNode {
  type: "LambdaExpression";
  params: IdentifierNode[];
  body: ASTNode;
}

export interface ClassDeclarationNode extends ASTNode {
  type: "ClassDeclaration";
  name: IdentifierNode;
  superClass: IdentifierNode | null;
  body: ASTNode[];
}

export interface PropertyDefinitionNode extends ASTNode {
  type: "PropertyDefinition";
  name: IdentifierNode;
  value: ASTNode | null;
  isStatic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isConstant: boolean;
}

export interface PropertyDeclarationNode extends ASTNode {
  type: "PropertyDeclaration";
  name: IdentifierNode;
  getter: FunctionDeclarationNode | LambdaExpressionNode | null;
  setter: FunctionDeclarationNode | LambdaExpressionNode | null;
}

export interface MethodDefinitionNode extends ASTNode {
  type: "MethodDefinition";
  name: IdentifierNode;
  function: FunctionDeclarationNode;
  isStatic: boolean;
  isConstructor: boolean;
  isPrivate: boolean;
  isProtected: boolean;
}

export interface IfStatementNode extends ASTNode {
  type: "IfStatement";
  test: ASTNode;
  consequent: ASTNode[];
  alternate: ASTNode[] | null;
}

export interface ReturnStatementNode extends ASTNode {
  type: "ReturnStatement";
  argument: ASTNode | null;
}

export interface ImportDeclarationNode extends ASTNode {
  type: "ImportDeclaration";
  specifiers: IdentifierNode[];
  source: StringLiteralNode;
}

export interface ExportDeclarationNode extends ASTNode {
  type: "ExportDeclaration";
  declaration: ASTNode;
}

export interface WhileStatementNode extends ASTNode {
  type: "WhileStatement";
  condition: ASTNode;
  body: ASTNode[];
}

export interface UpdateExpressionNode extends ASTNode {
  type: "UpdateExpression";
  operator: string;
  argument: ASTNode;
  prefix: boolean;
}

export interface BlockStatementNode extends ASTNode {
  type: "BlockStatement";
  body: ASTNode[];
}

export interface TypeNode extends ASTNode {
  type: "Type";
  name: string;
  isArray?: boolean;
}

export interface TypeDeclarationNode extends ASTNode {
  type: "TypeDeclaration";
  name: IdentifierNode;
  typeAnnotation: TypeNode;
}

export interface TypeInferenceNode extends ASTNode {
  type: "TypeInference";
  value: ASTNode;
}

// Type guard functions for AST nodes
export function isIdentifierNode(node: ASTNode): node is IdentifierNode {
  return node.type === "Identifier";
}

export function isStringLiteralNode(node: ASTNode): node is StringLiteralNode {
  return node.type === "StringLiteral";
}

export function isMemberExpressionNode(
  node: ASTNode
): node is MemberExpressionNode {
  return node.type === "MemberExpression";
}

export function isMethodDefinitionNode(
  node: ASTNode
): node is MethodDefinitionNode {
  return node.type === "MethodDefinition";
}

export function isPropertyDefinitionNode(
  node: ASTNode
): node is PropertyDefinitionNode {
  return node.type === "PropertyDefinition";
}

export function isTypeNode(node: ASTNode): node is TypeNode {
  return node.type === "Type";
}

export function isTypeDeclarationNode(
  node: ASTNode
): node is TypeDeclarationNode {
  return node.type === "TypeDeclaration";
}

export function isTypeInferenceNode(node: ASTNode): node is TypeInferenceNode {
  return node.type === "TypeInference";
}
