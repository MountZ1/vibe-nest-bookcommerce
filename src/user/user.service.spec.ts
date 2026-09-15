import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { UsersService } from "./user.service";
import { User } from "./entities/user.entity";
import { Role } from "./entities/role.entity";
import { Profile } from "./entities/profile.entity";

jest.mock("bcrypt");

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock query builder used only inside login()
  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    profileRepository = module.get(getRepositoryToken(Profile));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------
  // createUser
  // ---------------------------------------------------------------------
  describe("createUser", () => {
    const dto = {
      name: "John Doe",
      email: "john@example.com",
      password: "plainPassword",
    };

    it("should throw ConflictException if email already registered", async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 } as User);

      await expect(service.createUser(dto as any)).rejects.toThrow(ConflictException);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });

    it("should throw InternalServerErrorException if 'buyer' role not found", async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.createUser(dto as any)).rejects.toThrow(InternalServerErrorException);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: "buyer" },
      });
    });

    it("should create user, hash password, and return user without password", async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue({ id: 2, name: "buyer" } as Role);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      const createdEntity = {
        name: dto.name,
        email: dto.email,
        password: "hashedPassword",
        role_id: 2,
      };
      userRepository.create.mockReturnValue(createdEntity as User);

      const savedUser = {
        id: 10,
        name: dto.name,
        email: dto.email,
        password: "hashedPassword",
        role_id: 2,
      };
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await service.createUser(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: "hashedPassword",
        role_id: 2,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual({
        id: 10,
        name: dto.name,
        email: dto.email,
        role_id: 2,
      });
      expect((result as any).password).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------
  describe("login", () => {
    const dto = { email: "john@example.com", password: "plainPassword" };

    it("should throw UnauthorizedException if user not found", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 1,
        email: dto.email,
        password: "hashedPassword",
        role: { name: "buyer" },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, "hashedPassword");
    });

    it("should return a signed JWT when credentials are valid", async () => {
      const foundUser = {
        id: 1,
        email: dto.email,
        password: "hashedPassword",
        role: { name: "buyer" },
      };
      mockQueryBuilder.getOne.mockResolvedValue(foundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue("signed.jwt.token");

      const result = await service.login(dto as any);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: foundUser.id,
        email: foundUser.email,
        role: foundUser.role.name,
      });
      expect(result).toBe("signed.jwt.token");
    });
  });

  // ---------------------------------------------------------------------
  // getUserProfile
  // ---------------------------------------------------------------------
  describe("getUserProfile", () => {
    it("should return the profile matching the given user id", async () => {
      const user = { id: 5 } as User;
      const profile = { id: 100, user_id: 5, bio: "Hello" };
      profileRepository.findOne.mockResolvedValue(profile as any);

      const result = await service.getUserProfile(user);

      expect(profileRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: user.id },
      });
      expect(result).toEqual(profile);
    });

    it("should return null if profile not found", async () => {
      const user = { id: 5 } as User;
      profileRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserProfile(user);

      expect(result).toBeNull();
    });
  });
});
