import { IndexBuffer3D } from "../graphics/IndexBuffer3D"
import { VertexBuffer3D } from "../graphics/VertexBuffer3D"
import { VertexDeclaration } from "../graphics/VertexDeclaration"
import { LayaGL } from "../../layagl/LayaGL"
import { Render } from "../../renders/Render"
import { BufferStateBase } from "../../webgl/BufferStateBase"


/**
 * @private
 * <code>BufferState</code> 类用于实现渲染所需的Buffer状态集合。
 */
export class BufferState extends BufferStateBase {

	/**
	 * 创建一个 <code>BufferState</code> 实例。
	 */
	constructor() {
		super();

		/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
	}

	/**
	 * @private
	 * vertexBuffer的vertexDeclaration不能为空,该函数比较消耗性能，建议初始化时使用。
	 */
	applyVertexBuffer(vertexBuffer: VertexBuffer3D): void {//TODO:动态合并是否需要使用对象池机制
		if (BufferStateBase._curBindedBufferState === this) {
			var gl: any = LayaGL.instance;
			var verDec: VertexDeclaration = vertexBuffer.vertexDeclaration;
			var valueData: any = null;
			if (Render.supportWebGLPlusRendering)
				valueData = verDec._shaderValues._nativeArray;
			else
				valueData = verDec._shaderValues.getData();
			vertexBuffer.bind();
			for (var k in valueData) {
				var loc: number = parseInt(k);
				var attribute: any[] = valueData[k];
				gl.enableVertexAttribArray(loc);
				gl.vertexAttribPointer(loc, attribute[0], attribute[1], !!attribute[2], attribute[3], attribute[4]);
			}
		} else {
			throw "BufferState: must call bind() function first.";
		}
	}

	/**
	 * @private
	 * vertexBuffers中的vertexDeclaration不能为空,该函数比较消耗性能，建议初始化时使用。
	 */
	applyVertexBuffers(vertexBuffers: VertexBuffer3D[]): void {
		if (BufferStateBase._curBindedBufferState === this) {
			var gl: any = LayaGL.instance;
			for (var i: number = 0, n: number = vertexBuffers.length; i < n; i++) {
				var verBuf: VertexBuffer3D = vertexBuffers[i];
				var verDec: VertexDeclaration = verBuf.vertexDeclaration;
				var valueData: any = null;
				if (Render.supportWebGLPlusRendering)
					valueData = verDec._shaderValues._nativeArray;
				else
					valueData = verDec._shaderValues.getData();
				verBuf.bind();
				for (var k in valueData) {
					var loc: number = parseInt(k);
					var attribute: any[] = valueData[k];
					gl.enableVertexAttribArray(loc);
					gl.vertexAttribPointer(loc, attribute[0], attribute[1], !!attribute[2], attribute[3], attribute[4]);
				}
			}
		} else {
			throw "BufferState: must call bind() function first.";
		}
	}

	/**
	 * @private
	 */
	applyInstanceVertexBuffer(vertexBuffer: VertexBuffer3D): void {//TODO:动态合并是否需要使用对象池机制
		if (LayaGL.layaGPUInstance.supportInstance()) {//判断是否支持Instance
			if (BufferStateBase._curBindedBufferState === this) {
				var gl: any = LayaGL.instance;
				var verDec: VertexDeclaration = vertexBuffer.vertexDeclaration;
				var valueData: any = null;
				if (Render.supportWebGLPlusRendering)
					valueData = verDec._shaderValues._nativeArray;
				else
					valueData = verDec._shaderValues.getData();
				vertexBuffer.bind();
				for (var k in valueData) {
					var loc: number = parseInt(k);
					var attribute: any[] = valueData[k];
					gl.enableVertexAttribArray(loc);
					gl.vertexAttribPointer(loc, attribute[0], attribute[1], !!attribute[2], attribute[3], attribute[4]);
					LayaGL.layaGPUInstance.vertexAttribDivisor(loc, 1);
				}
			} else {
				throw "BufferState: must call bind() function first.";
			}
		}
	}

	/**
	 * @private
	 */
	applyIndexBuffer(indexBuffer: IndexBuffer3D): void {
		if (BufferStateBase._curBindedBufferState === this) {
			if (this._bindedIndexBuffer !== indexBuffer) {
				indexBuffer._bindForVAO();//TODO:可和vao合并bind
				this._bindedIndexBuffer = indexBuffer;
			}
		} else {
			throw "BufferState: must call bind() function first.";
		}
	}
}


