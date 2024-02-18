import * as jwt from 'jsonwebtoken';

export interface JwtPayload extends jwt.JwtPayload {
	userId: string;
	iat: number;
	exp: number;
}
