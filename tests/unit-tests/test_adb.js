"use strict";

/*
 * Copyright (C) 2017-2019 UBports Foundation <info@ubports.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const fs = require('fs');
const request = require('request');

const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const Adb = require('../../src/module.js').Adb;

describe('Adb module', function() {
  describe("constructor()", function() {
    it("should create default adb when called without arguments", function() {
      const adb = new Adb();
      expect(adb.exec).to.exist;
      expect(adb.log).to.equal(console.log);
      expect(adb.port).to.equal(5037);
    });
    it("should create default adb when called with unrelated object", function() {
      const adb = new Adb({ });
      expect(adb.exec).to.exist;
      expect(adb.log).to.equal(console.log);
      expect(adb.port).to.equal(5037);
    });
    it("should create custom adb when called with valid options", function() {
      const execStub = sinon.stub();
      const logStub = sinon.stub();
      const adb = new Adb({exec: execStub, log: logStub, port: 1234});
      expect(adb.exec).to.equal(execStub);
      expect(adb.exec).to.not.equal(logStub);
      expect(adb.log).to.equal(logStub);
      expect(adb.log).to.not.equal(execStub);
      expect(adb.port).to.equal(1234);
    });
  });
  describe("startServer()", function() {
    it("should kill all servers and start a new one", function() {
      const execFake = sinon.fake((args, callback) => { callback(); });
      const logSpy = sinon.spy();
      const adb = new Adb({exec: execFake, log: logSpy});
      return adb.startServer().then((r) => {
        expect(r).to.equal(undefined);
        expect(execFake).to.have.been.calledTwice;
        expect(execFake).to.have.been.calledWith(["-P", 5037, "kill-server"]);
        expect(execFake).to.have.been.calledWith(["-P", 5037, "start-server"]);
        expect(logSpy).to.have.been.calledTwice;
        expect(logSpy).to.have.been.calledWith("killing all running adb servers");
        expect(logSpy).to.have.been.calledWith("starting adb server on port 5037");
      });
    });
  });
  describe("killServer()", function() {
    it("should kill all servers", function() {
      const execFake = sinon.fake((args, callback) => { callback(); });
      const logSpy = sinon.spy();
      const adb = new Adb({exec: execFake, log: logSpy});
      return adb.killServer().then((r) => {
        expect(r).to.equal(undefined);
        expect(execFake).to.have.been.calledOnce;
        expect(execFake).to.not.have.been.calledTwice;
        expect(execFake).to.have.been.calledWith(["-P", 5037, "kill-server"]);
        expect(logSpy).to.not.have.been.calledTwice;
        expect(logSpy).to.have.been.calledWith("killing all running adb servers");
      });
    });
  });
  describe("getSerialno()", function() {
    it("should return serialnumber", function() {
      const execFake = sinon.fake((args, callback) => { callback(false, "1234567890ABCDEF\n"); });
      const logSpy = sinon.spy();
      const adb = new Adb({exec: execFake, log: logSpy});
      return adb.getSerialno().then((r) => {
        expect(r).to.equal("1234567890ABCDEF");
        expect(execFake).to.have.been.calledOnce;
        expect(execFake).to.have.been.calledWith(["-P", 5037, "get-serialno"]);
      });
    });
    it("should return error on invalid return", function() {
      const execFake = sinon.fake((args, callback) => { callback(false, "This is an invalid string"); });
      const logSpy = sinon.spy();
      const adb = new Adb({exec: execFake, log: logSpy});
      return expect(adb.getSerialno()).to.be.rejectedWith("invalid device id");
    });
  });
});