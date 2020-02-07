import { ILaya3D } from "../../../ILaya3D";
import { LayaGL } from "../../layagl/LayaGL";
import { RenderTextureDepthFormat } from "../../resource/RenderTextureFormat";
import { BaseCamera } from "../core/BaseCamera";
import { Camera } from "../core/Camera";
import { DirectionLight } from "../core/light/DirectionLight";
import { ShadowUtils } from "../core/light/ShdowUtils";
import { Scene3D } from "../core/scene/Scene3D";
import { Scene3DShaderDeclaration } from "../core/scene/Scene3DShaderDeclaration";
import { BoundBox } from "../math/BoundBox";
import { BoundSphere } from "../math/BoundSphere";
import { MathUtils3D } from "../math/MathUtils3D";
import { Matrix4x4 } from "../math/Matrix4x4";
import { Vector2 } from "../math/Vector2";
import { Vector3 } from "../math/Vector3";
import { Vector4 } from "../math/Vector4";
import { RenderTexture } from "../resource/RenderTexture";
import { ShaderData } from "../shader/ShaderData";


export class ShadowCasterPass {
	/**@internal */
	static _maxCascades: number = 4;

	/**@internal */
	static _tempVector30: Vector3 = new Vector3();
	/**@internal */
	static _tempVector31: Vector3 = new Vector3();
	/**@internal */
	static _tempVector32: Vector3 = new Vector3();
	/**@internal */
	static _tempVector33: Vector3 = new Vector3();
	/**@internal */
	static _tempVector34: Vector3 = new Vector3();
	/**@internal */
	static _tempVector35: Vector3 = new Vector3();
	/**@internal */
	static _tempVector36: Vector3 = new Vector3();
	/**@internal */
	static _tempVector37: Vector3 = new Vector3();
	/**@internal */
	static _tempBoundSphere0: BoundSphere = new BoundSphere(new Vector3(), 0);
	/**@internal */
	static _tempMatrix0: Matrix4x4 = new Matrix4x4();

	/**@internal */
	private _spiltDistance: number[] = [];
	/**@internal */
	private _currentPSSM: number = -1;
	/**@internal */
	_shadowMapCount: number = 3;
	/**@internal */
	_maxDistance: number = 200.0;
	/**@internal */
	private _ratioOfDistance: number = 1.0 / this._shadowMapCount;

	/**@internal */
	_light: DirectionLight;
	/**@internal */
	cameras: Camera[];
	/**@internal */
	private _shadowMapTextureSize: number = 1024;
	/**@internal */
	private _scene: Scene3D = null;
	/**@internal */
	private _boundingSphere: BoundSphere[] = new Array<BoundSphere>(ShadowCasterPass._maxCascades + 1);
	/**@internal */
	_boundingBox: BoundBox[] = new Array<BoundBox>(ShadowCasterPass._maxCascades + 1);
	/**@internal */
	private _frustumPos: Vector3[] = new Array<Vector3>((ShadowCasterPass._maxCascades + 1) * 4);
	/**@internal */
	private _uniformDistance: number[] = new Array<number>(ShadowCasterPass._maxCascades + 1);
	/**@internal */
	private _logDistance: number[] = new Array<number>(ShadowCasterPass._maxCascades + 1);
	/**@internal */
	private _dimension: Vector2[] = new Array<Vector2>(ShadowCasterPass._maxCascades + 1);
	/** @internal */
	private _PCFType: number = 0;
	/** @internal */
	private _tempScaleMatrix44: Matrix4x4 = new Matrix4x4();
	/** @internal */
	private _shadowPCFOffset: Vector2 = new Vector2(1.0 / 1024.0, 1.0 / 1024.0);
	/** @internal */
	private _shaderValueDistance: Vector4 = new Vector4();
	/** @internal */
	private _shaderValueLightVP: Float32Array = null;
	/** @internal */
	private _shaderValueVPs: Float32Array[];

	_shadowMap: RenderTexture;

	constructor() {
		this.cameras = [];
		this._shaderValueVPs = [];
		var i: number;
		for (i = 0; i < this._spiltDistance.length; i++) {
			this._spiltDistance[i] = 0.0;
		}

		for (i = 0; i < this._dimension.length; i++)
			this._dimension[i] = new Vector2();


		for (i = 0; i < this._frustumPos.length; i++)
			this._frustumPos[i] = new Vector3();


		for (i = 0; i < this._boundingBox.length; i++)
			this._boundingBox[i] = new BoundBox(new Vector3(), new Vector3());


		for (i = 0; i < this._boundingSphere.length; i++)
			this._boundingSphere[i] = new BoundSphere(new Vector3(), 0.0);

		Matrix4x4.createScaling(new Vector3(0.5, 0.5, 1.0), this._tempScaleMatrix44);
		this._tempScaleMatrix44.elements[12] = 0.5;
		this._tempScaleMatrix44.elements[13] = 0.5;
	}

	setInfo(scene: Scene3D, maxDistance: number, globalParallelDir: Vector3, shadowMapTextureSize: number, numberOfPSSM: number, PCFType: number): void {
		if (numberOfPSSM > ShadowCasterPass._maxCascades) {
			this._shadowMapCount = ShadowCasterPass._maxCascades;
		}
		this._scene = scene;
		this._maxDistance = maxDistance;
		this.shadowMapCount = numberOfPSSM;
		this._ratioOfDistance = 1.0 / this._shadowMapCount;
		for (var i: number = 0; i < this._spiltDistance.length; i++) {
			this._spiltDistance[i] = 0.0;
		}
		this._shadowMapTextureSize = shadowMapTextureSize;
		this._shadowPCFOffset.x = 1.0 / this._shadowMapTextureSize;
		this._shadowPCFOffset.y = 1.0 / this._shadowMapTextureSize;
		this.setPCFType(PCFType);
	}

	setPCFType(PCFtype: number): void {
		this._PCFType = PCFtype;
		var defineData: ShaderData = this._scene._shaderValues;
		switch (this._PCFType) {
			case 0:
				defineData.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF_NO);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF1);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF2);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF3);
				break;
			case 1:
				defineData.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF1);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF_NO);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF2);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF3);
				break;
			case 2:
				defineData.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF2);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF_NO);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF1);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF3);
				break;
			case 3:
				defineData.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF3);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF_NO);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF1);
				defineData.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PCF2);
				break;
		}
	}

	set shadowMapCount(value: number) {
		value = value > 0 ? value : 1;
		value = value <= ShadowCasterPass._maxCascades ? value : ShadowCasterPass._maxCascades;
		if (this._shadowMapCount != value) {
			this._shadowMapCount = value;
			this._ratioOfDistance = 1.0 / this._shadowMapCount;

			this._shaderValueLightVP = new Float32Array(value * 16);
			this._shaderValueVPs.length = value;
			for (var i: number = 0; i < value; i++)
				this._shaderValueVPs[i] = new Float32Array(this._shaderValueLightVP.buffer, i * 64);
		}
	}


	private _beginSampler(index: number, sceneCamera: BaseCamera): void {
		this._currentPSSM = index;
		this._update(index, sceneCamera);
	}

	/**
	 * @internal
	 */
	endSampler(sceneCamera: BaseCamera): void {
		this._currentPSSM = -1;
	}

	/**
	 * @internal
	 */
	_calcAllLightCameraInfo(sceneCamera: BaseCamera): void {
		if (this._shadowMapCount === 1) {
			this._beginSampler(0, sceneCamera);
			this.endSampler(sceneCamera);
		} else {
			for (var i: number = 0, n: number = this._shadowMapCount + 1; i < n; i++) {
				this._beginSampler(i, sceneCamera);
				this.endSampler(sceneCamera);
			}
		}
	}

	/**
	 * @internal
	 */
	private _recalculate(nearPlane: number, fieldOfView: number, aspectRatio: number): void {
		this._calcSplitDistance(nearPlane);
		this._rebuildRenderInfo();
	}

	/**
	 * @internal
	 */
	private _update(index: number, sceneCamera: BaseCamera): void {
		var nearPlane: number = sceneCamera.nearPlane;
		var fieldOfView: number = sceneCamera.fieldOfView;
		var aspectRatio: number = (<Camera>sceneCamera).aspectRatio;
		this._recalculate(nearPlane, fieldOfView, aspectRatio);
		this._uploadShaderValue();
		this._getLightViewProject(sceneCamera);
	}

	/**
	 * @internal
	 */
	private _uploadShaderValue(): void {
		var sceneSV: ShaderData = this._scene._shaderValues;
		switch (this._shadowMapCount) {
			case 1:
				sceneSV.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM1);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM2);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM3);
				break;
			case 2:
				sceneSV.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM2);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM1);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM3);
				break;
			case 3:
				sceneSV.addDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM3);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM1);
				sceneSV.removeDefine(Scene3DShaderDeclaration.SHADERDEFINE_SHADOW_PSSM2);
				break;
		}


		sceneSV.setVector(ILaya3D.Scene3D.SHADOWDISTANCE, this._shaderValueDistance);
		sceneSV.setBuffer(ILaya3D.Scene3D.SHADOWLIGHTVIEWPROJECT, this._shaderValueLightVP);
		sceneSV.setVector2(ILaya3D.Scene3D.SHADOWMAPPCFOFFSET, this._shadowPCFOffset);
	}

	/**
	 * @internal
	 */
	private _getLightViewProject(sceneCamera: BaseCamera): void {
		var boundSphere: BoundSphere = ShadowCasterPass._tempBoundSphere0;
		var viewProjectMatrix: Matrix4x4 = this.getFrustumMatrix(<Camera>sceneCamera);
		this.getBoundSphereOfFrustum(viewProjectMatrix, boundSphere, sceneCamera._transform.position, Math.min(sceneCamera.farPlane, this._maxDistance));

		var lightWorld: Matrix4x4 = this._light._transform.worldMatrix;
		var lightUp: Vector3 = ShadowCasterPass._tempVector32;
		var lightSide: Vector3 = ShadowCasterPass._tempVector31;
		var lightDirection: Vector3 = ShadowCasterPass._tempVector30;
		lightUp.setValue(lightWorld.getElementByRowColumn(0, 0), lightWorld.getElementByRowColumn(0, 1), lightWorld.getElementByRowColumn(0, 2));
		lightSide.setValue(lightWorld.getElementByRowColumn(1, 0), lightWorld.getElementByRowColumn(1, 1), lightWorld.getElementByRowColumn(1, 2));
		lightDirection.setValue(lightWorld.getElementByRowColumn(2, 0), lightWorld.getElementByRowColumn(2, 1), lightWorld.getElementByRowColumn(2, 2));
		Vector3.normalize(lightUp, lightUp);
		Vector3.normalize(lightSide, lightSide);
		Vector3.normalize(lightDirection, lightDirection);

		for (var i: number = 0; i < 1; i++) {//TODO split
			var center: Vector3 = boundSphere.center;
			var radius: number = boundSphere.radius;

			// to solve shdow swimming problem
			var sizeSM: number = this._light.shadowResolution;
			var sizeUnit: number = sizeSM / radius;
			var radiusUnit: number = radius / sizeSM;
			var upLen: number = Math.ceil(Vector3.dot(center, lightUp) * sizeUnit) * radiusUnit;
			var SideLen: number = Math.ceil(Vector3.dot(center, lightSide) * sizeUnit) * radiusUnit;
			var dirLength: number = Vector3.dot(center, lightDirection);

			center.x = lightUp.x * upLen + lightSide.x * SideLen + lightDirection.x * dirLength;
			center.y = lightUp.y * upLen + lightSide.y * SideLen + lightDirection.y * dirLength;
			center.z = lightUp.z * upLen + lightSide.z * SideLen + lightDirection.z * dirLength;

			var origin: Vector3 = ShadowCasterPass._tempVector31;
			Vector3.scale(this._light._direction, radius, origin);
			Vector3.subtract(center, origin, origin);

			var curLightCamera: Camera = this.cameras[this._currentPSSM];
			curLightCamera._transform.position = origin;
			curLightCamera._transform.lookAt(center, lightUp, false);

			Matrix4x4.createOrthoOffCenter(-radius, radius, -radius, radius, this._light._shadowNearPlane, radius * 2.0, curLightCamera.projectionMatrix);

			//calc frustum
			var projectView: Matrix4x4 = curLightCamera.projectionViewMatrix;
			ShadowCasterPass.multiplyMatrixOutFloat32Array(this._tempScaleMatrix44, projectView, this._shaderValueVPs[this._currentPSSM]);
		}
	}

	/**
	 * @internal
	 */
	private _rebuildRenderInfo(): void {
		var nNum: number = this._shadowMapCount + 1;
		var i: number;
		this.cameras.length = nNum;
		for (i = 0; i < nNum; i++) {
			if (!this.cameras[i]) {
				var camera: Camera = new Camera();
				camera.name = "lightCamera" + i;
				camera.clearColor = new Vector4(1.0, 1.0, 1.0, 1.0);
				this.cameras[i] = camera;
			}
		}
	}


	/**
	 * 计算两个矩阵的乘法
	 * @param	left left矩阵
	 * @param	right  right矩阵
	 * @param	out  输出矩阵
	 */
	static multiplyMatrixOutFloat32Array(left: Matrix4x4, right: Matrix4x4, out: Float32Array): void {
		var i: number, a: Float32Array, b: Float32Array, ai0: number, ai1: number, ai2: number, ai3: number;
		a = left.elements;
		b = right.elements;
		for (i = 0; i < 4; i++) {
			ai0 = a[i];
			ai1 = a[i + 4];
			ai2 = a[i + 8];
			ai3 = a[i + 12];
			out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
			out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
			out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
			out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
		}
	}

	setShadowMapTextureSize(size: number): void {
		if (size !== this._shadowMapTextureSize) {
			this._shadowMapTextureSize = size;
			this._shadowPCFOffset.x = 1 / this._shadowMapTextureSize;
			this._shadowPCFOffset.y = 1 / this._shadowMapTextureSize;
		}
	}


	/**
	 * @internal
	 */
	start(): void {
		var shadowMap: RenderTexture = ShadowUtils.getTemporaryShadowTexture(this._shadowMapTextureSize, this._shadowMapTextureSize, RenderTextureDepthFormat.DEPTH_16);
		var sceneSV: ShaderData = this._scene._shaderValues;
		sceneSV.setTexture(ILaya3D.Scene3D.SHADOWMAPTEXTURE1, shadowMap);
		shadowMap._start();
		this._shadowMap = shadowMap;
	}


	//TOOD:TEMP
	tempViewPort(): void {
		var gl = LayaGL.instance;
		LayaGL.instance.viewport(0, 0, this._shadowMap.width, this._shadowMap.height);
		gl.enable(gl.SCISSOR_TEST);
		LayaGL.instance.scissor(0, 0, this._shadowMap.width, this._shadowMap.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	/**
	 * @internal
	 */
	end(): void {
		var gl = LayaGL.instance;
		this._shadowMap._end();
		gl.disable(gl.SCISSOR_TEST);
	}

	/**
	 * @internal
	 */
	clear(): void {
		RenderTexture.recoverToPool(this._shadowMap);
		// this._shadowMap = null; TODO:
	}

	/**
	 * @internal
	 */
	getFrustumMatrix(camera: Camera): Matrix4x4 {
		if (this._maxDistance < camera.farPlane) {
			var projectionViewMatrix: Matrix4x4 = ShadowCasterPass._tempMatrix0;
			Matrix4x4.createPerspective(camera.fieldOfView * MathUtils3D.Deg2Rad, camera.aspectRatio, camera.nearPlane, this._maxDistance, projectionViewMatrix);
			Matrix4x4.multiply(projectionViewMatrix, camera.viewMatrix, projectionViewMatrix)
			return projectionViewMatrix;
		}
		else {
			return camera.projectionViewMatrix;
		}
	}

	/**
	 * @internal
	 */
	getBoundSphereOfFrustum(viewProjectMatrix: Matrix4x4, outBoundSphere: BoundSphere, cameraPos: Vector3, maxDistance: number): void {
		// use project space coordinate to get world point is better than get form the Frustum,unless you already have the world Point.
		var invViewProjMat: Matrix4x4 = ShadowCasterPass._tempMatrix0;
		// var invViewProjMat: Matrix4x4 = new Matrix4x4();
		viewProjectMatrix.invert(invViewProjMat);

		var nlb: Vector3 = ShadowCasterPass._tempVector30;
		var flb: Vector3 = ShadowCasterPass._tempVector31;
		var frt: Vector3 = ShadowCasterPass._tempVector32;

		var abXac: Vector3 = ShadowCasterPass._tempVector33;
		var ab: Vector3 = ShadowCasterPass._tempVector34;
		var ac: Vector3 = ShadowCasterPass._tempVector35;
		var abXacXab: Vector3 = ShadowCasterPass._tempVector36;
		var acXabXac: Vector3 = ShadowCasterPass._tempVector37;

		nlb.setValue(-1.0, -1.0, 0.0);
		flb.setValue(-1.0, -1.0, 1.0);
		frt.setValue(1.0, 1.0, 1.0);

		Vector3.transformCoordinate(nlb, invViewProjMat, nlb);
		Vector3.transformCoordinate(flb, invViewProjMat, flb);
		Vector3.transformCoordinate(frt, invViewProjMat, frt);

		// Vector3.subtract(flb, cameraPos, flb);
		// Vector3.normalize(flb, flb);
		// Vector3.scale(flb, maxDistance, flb);
		// Vector3.add(cameraPos, flb, flb);
		// Vector3.subtract(frt, cameraPos, frt);
		// Vector3.normalize(frt, frt);
		// Vector3.scale(frt, maxDistance, frt);
		// Vector3.add(cameraPos, frt, frt);

		// get circumcenter of a triangle
		// https://gamedev.stackexchange.com/questions/60630/how-do-i-find-the-circumcenter-of-a-triangle-in-3d
		// https://www.ics.uci.edu/~eppstein/junkyard/circumcenter.html
		Vector3.subtract(frt, nlb, ac);
		Vector3.subtract(flb, nlb, ab);
		Vector3.cross(ab, ac, abXac);
		Vector3.cross(abXac, ab, abXacXab);
		Vector3.cross(ac, abXac, acXabXac);
		var acLen2: number = Vector3.scalarLengthSquared(ac);
		var abLen2: number = Vector3.scalarLengthSquared(ab);
		var abXacLen2Double: number = Vector3.scalarLengthSquared(abXac) * 2.0;
		var toCenX: number = (abXacXab.x * acLen2 + acXabXac.x * abLen2) / abXacLen2Double;
		var toCenY: number = (abXacXab.y * acLen2 + acXabXac.y * abLen2) / abXacLen2Double;
		var toCenZ: number = (abXacXab.z * acLen2 + acXabXac.z * abLen2) / abXacLen2Double;
		outBoundSphere.radius = Math.sqrt(toCenX * toCenX + toCenY * toCenY + toCenZ * toCenZ);
		var center: Vector3 = outBoundSphere.center;
		center.x = nlb.x + toCenX;
		center.y = nlb.y + toCenY;
		center.z = nlb.z + toCenZ;
	}

	/**
	 * @internal
	 */
	private _calcSplitDistance(nearPlane: number): void {//TODO:删除
		var far: number = this._maxDistance;
		var invNumberOfPSSM: number = 1.0 / this._shadowMapCount;
		var i: number;
		for (i = 0; i <= this._shadowMapCount; i++) {
			this._uniformDistance[i] = nearPlane + (far - nearPlane) * i * invNumberOfPSSM;
		}

		var farDivNear: number = far / nearPlane;
		for (i = 0; i <= this._shadowMapCount; i++) {
			var n: number = Math.pow(farDivNear, i * invNumberOfPSSM);
			this._logDistance[i] = nearPlane * n;
		}

		for (i = 0; i <= this._shadowMapCount; i++) {
			this._spiltDistance[i] = this._uniformDistance[i] * this._ratioOfDistance + this._logDistance[i] * (1.0 - this._ratioOfDistance);
		}

		this._shaderValueDistance.x = (this._spiltDistance[1] != undefined) && (this._spiltDistance[1]);
		this._shaderValueDistance.y = (this._spiltDistance[2] != undefined) && (this._spiltDistance[2]);
		this._shaderValueDistance.z = (this._spiltDistance[3] != undefined) && (this._spiltDistance[3]);
		this._shaderValueDistance.w = (this._spiltDistance[4] != undefined) && (this._spiltDistance[4]); //_spiltDistance[4]为undefine 微信小游戏
	}
}

